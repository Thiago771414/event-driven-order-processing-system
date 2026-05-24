import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DbService } from '../db/db.service';
import { TOPICS } from '../messaging/topics';
import { ORDER_STATUS, PAYMENT_STATUS } from './payment-status';
import {
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  PaymentReconciliationNeededEvent,
  PaymentVerificationRequestedEvent,
} from './payments.events';

export type PaymentRecord = {
  paymentId: string;
  orderId: string;
  idempotencyKey: string;
  gatewayTransactionReference: string;
  amount: number;
  correlationId: string;
};

type PaymentRecordRow = {
  payment_id: string;
  order_id: string;
  idempotency_key: string;
  gateway_transaction_reference: string;
  amount: string | number;
  correlation_id: string;
};

type PaymentOutboxEvent =
  | PaymentConfirmedEvent
  | PaymentFailedEvent
  | PaymentReconciliationNeededEvent;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: DbService) {}

  async confirmPayment(
    event: PaymentVerificationRequestedEvent,
    confirmedBy: 'worker' | 'reconciliation',
  ): Promise<boolean> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const updated = await client.query<{ id: string }>(
        `
        UPDATE payments
        SET status = $2,
            last_gateway_status = 'confirmed',
            last_error = NULL,
            next_verification_at = NULL,
            updated_at = now()
        WHERE id = $1
          AND status NOT IN ($2, $3)
        RETURNING id
        `,
        [
          event.data.paymentId,
          PAYMENT_STATUS.CONFIRMED,
          PAYMENT_STATUS.FAILED,
        ],
      );

      if (updated.rowCount === 0) {
        await client.query('COMMIT');
        return false;
      }

      await client.query(
        `UPDATE orders SET status = $2, last_error = NULL WHERE id = $1`,
        [event.data.orderId, ORDER_STATUS.CONFIRMED],
      );

      await this.insertOutboxEvent(client, {
        eventId: randomUUID(),
        type: 'payments.confirmed.v1',
        occurredAt: new Date().toISOString(),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        data: {
          orderId: event.data.orderId,
          paymentId: event.data.paymentId,
          gatewayTransactionReference:
            event.data.gatewayTransactionReference,
          amount: event.data.amount,
          confirmedBy,
        },
      });

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async failPayment(
    event: PaymentVerificationRequestedEvent,
    reason: string,
    failedBy: 'worker' | 'reconciliation',
  ): Promise<boolean> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const updated = await client.query<{ id: string }>(
        `
        UPDATE payments
        SET status = $2,
            last_gateway_status = 'failed',
            last_error = $3,
            next_verification_at = NULL,
            updated_at = now()
        WHERE id = $1
          AND status NOT IN ($2, $4)
        RETURNING id
        `,
        [
          event.data.paymentId,
          PAYMENT_STATUS.FAILED,
          reason,
          PAYMENT_STATUS.CONFIRMED,
        ],
      );

      if (updated.rowCount === 0) {
        await client.query('COMMIT');
        return false;
      }

      await client.query(
        `UPDATE orders SET status = $2, last_error = $3 WHERE id = $1`,
        [event.data.orderId, ORDER_STATUS.CANCELED, reason],
      );

      await this.insertOutboxEvent(client, {
        eventId: randomUUID(),
        type: 'payments.failed.v1',
        occurredAt: new Date().toISOString(),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        data: {
          orderId: event.data.orderId,
          paymentId: event.data.paymentId,
          gatewayTransactionReference:
            event.data.gatewayTransactionReference,
          amount: event.data.amount,
          reason,
          failedBy,
        },
      });

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async markVerificationFailure(
    paymentId: string,
    error: string,
  ): Promise<void> {
    await this.db.pool.query(
      `
      UPDATE payments
      SET verification_attempts = verification_attempts + 1,
          last_error = $2,
          next_verification_at = now() + (
            CASE
              WHEN verification_attempts < 1 THEN interval '5 seconds'
              WHEN verification_attempts < 2 THEN interval '15 seconds'
              WHEN verification_attempts < 3 THEN interval '60 seconds'
              ELSE interval '5 minutes'
            END
          ),
          updated_at = now()
      WHERE id = $1
        AND status = $3
      `,
      [paymentId, error, PAYMENT_STATUS.PENDING_VERIFICATION],
    );
  }

  async findPaymentsForReconciliation(limit = 50): Promise<PaymentRecord[]> {
    const result = await this.db.pool.query<PaymentRecordRow>(
      `
      SELECT
        p.id AS payment_id,
        p.order_id,
        p.idempotency_key,
        p.gateway_transaction_reference,
        p.amount,
        o.correlation_id
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.status IN ($1, $2)
        AND (
          p.reconciliation_checked_at IS NULL
          OR p.reconciliation_checked_at < now() - interval '5 minutes'
        )
      ORDER BY p.created_at ASC
      LIMIT $3
      `,
      [
        PAYMENT_STATUS.PENDING_VERIFICATION,
        PAYMENT_STATUS.RECONCILIATION_NEEDED,
        limit,
      ],
    );

    return result.rows.map((row) => ({
      paymentId: row.payment_id,
      orderId: row.order_id,
      idempotencyKey: row.idempotency_key,
      gatewayTransactionReference: row.gateway_transaction_reference,
      amount: Number(row.amount),
      correlationId: row.correlation_id,
    }));
  }

  async touchReconciliation(paymentId: string): Promise<void> {
    await this.db.pool.query(
      `
      UPDATE payments
      SET reconciliation_checked_at = now(),
          updated_at = now()
      WHERE id = $1
      `,
      [paymentId],
    );
  }

  async markReconciliationNeeded(
    payment: PaymentRecord,
    reason: string,
  ): Promise<boolean> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const updated = await client.query<{ id: string }>(
        `
        UPDATE payments
        SET status = $2,
            reconciliation_checked_at = now(),
            last_error = $3,
            updated_at = now()
        WHERE id = $1
          AND status NOT IN ($4, $5)
        RETURNING id
        `,
        [
          payment.paymentId,
          PAYMENT_STATUS.RECONCILIATION_NEEDED,
          reason,
          PAYMENT_STATUS.CONFIRMED,
          PAYMENT_STATUS.FAILED,
        ],
      );

      if (updated.rowCount === 0) {
        await client.query('COMMIT');
        return false;
      }

      await this.insertOutboxEvent(client, {
        eventId: randomUUID(),
        type: 'payments.reconciliation.needed.v1',
        occurredAt: new Date().toISOString(),
        correlationId: payment.correlationId,
        idempotencyKey: payment.idempotencyKey,
        data: {
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          gatewayTransactionReference:
            payment.gatewayTransactionReference,
          amount: payment.amount,
          reason,
        },
      });

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async insertOutboxEvent(
    client: PoolClient,
    event: PaymentOutboxEvent,
  ) {
    const topicByType = {
      'payments.confirmed.v1': TOPICS.PAYMENT_CONFIRMED,
      'payments.failed.v1': TOPICS.PAYMENT_FAILED,
      'payments.reconciliation.needed.v1':
        TOPICS.PAYMENT_RECONCILIATION_NEEDED,
    } as const;

    await client.query(
      `
      INSERT INTO outbox_events
        (
          id,
          aggregate_type,
          aggregate_id,
          event_type,
          topic,
          payload,
          correlation_id,
          idempotency_key,
          partition_key
        )
      VALUES
        ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
      `,
      [
        randomUUID(),
        'payment',
        event.data.paymentId,
        event.type,
        topicByType[event.type],
        JSON.stringify(event),
        event.correlationId,
        event.idempotencyKey,
        event.data.orderId,
      ],
    );
  }
}
