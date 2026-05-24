import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { DbService } from '../db/db.service';
import { TOPICS } from '../messaging/topics';
import { MetricsService } from '../metrics/metrics.service';
import { ORDER_STATUS } from '../orders/order-status';
import { PaymentWebhookSchema } from './dto';
import { PAYMENT_STATUS } from './payment-status';
import {
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  PaymentVerificationRequestedEvent,
} from './payments.events';

type PaymentRow = {
  id: string;
  order_id: string;
  idempotency_key: string;
  gateway_transaction_reference: string;
  amount: number | string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DbService,
    private readonly metrics: MetricsService,
  ) {}

  async handleWebhook(
    input: unknown,
    headers: { correlationId?: string },
  ): Promise<{
    ok: true;
    duplicate: boolean;
    paymentId?: string;
    status?: string;
  }> {
    const parsed = PaymentWebhookSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const body = parsed.data;
    const correlationId = headers.correlationId ?? randomUUID();

    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const payment = await this.findPaymentForUpdate(client, {
        gatewayTransactionReference: body.gatewayTransactionReference,
        idempotencyKey: body.idempotencyKey,
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const webhookInsert = await client.query<{ event_id: string }>(
        `
        INSERT INTO payment_webhook_events (event_id, payment_id, payload)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
        `,
        [body.eventId, payment.id, JSON.stringify(body)],
      );

      if (webhookInsert.rowCount === 0) {
        await client.query('COMMIT');
        this.metrics.paymentWebhooksTotal.inc({
          status: body.status,
          result: 'duplicate',
        });
        return { ok: true, duplicate: true, paymentId: payment.id };
      }

      const event = await this.applyWebhookTransition(client, {
        payment,
        gatewayStatus: body.status,
        reason: body.reason,
        correlationId,
      });

      await this.insertOutboxEvent(client, event);

      await client.query('COMMIT');

      this.metrics.paymentWebhooksTotal.inc({
        status: body.status,
        result: 'processed',
      });

      return {
        ok: true,
        duplicate: false,
        paymentId: payment.id,
        status: event.type,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async findPaymentForUpdate(
    client: PoolClient,
    input: {
      gatewayTransactionReference?: string;
      idempotencyKey?: string;
    },
  ): Promise<PaymentRow | null> {
    const result = await client.query<PaymentRow>(
      `
      SELECT
        id,
        order_id,
        idempotency_key,
        gateway_transaction_reference,
        amount
      FROM payments
      WHERE gateway_transaction_reference = $1
         OR idempotency_key = $2
      FOR UPDATE
      `,
      [
        input.gatewayTransactionReference ?? '',
        input.idempotencyKey ?? '',
      ],
    );

    return result.rows[0] ?? null;
  }

  private async applyWebhookTransition(
    client: PoolClient,
    input: {
      payment: PaymentRow;
      gatewayStatus: 'confirmed' | 'failed' | 'unknown';
      reason?: string;
      correlationId: string;
    },
  ): Promise<
    | PaymentConfirmedEvent
    | PaymentFailedEvent
    | PaymentVerificationRequestedEvent
  > {
    const base = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      correlationId: input.correlationId,
      idempotencyKey: input.payment.idempotency_key,
      data: {
        orderId: input.payment.order_id,
        paymentId: input.payment.id,
        gatewayTransactionReference:
          input.payment.gateway_transaction_reference,
        amount: Number(input.payment.amount),
      },
    };

    if (input.gatewayStatus === 'confirmed') {
      await client.query(
        `
        UPDATE payments
        SET status = $2,
            last_gateway_status = 'confirmed',
            last_error = NULL,
            updated_at = now()
        WHERE id = $1
        `,
        [input.payment.id, PAYMENT_STATUS.CONFIRMED],
      );
      await client.query(
        `UPDATE orders SET status = $2 WHERE id = $1`,
        [input.payment.order_id, ORDER_STATUS.CONFIRMED],
      );

      return {
        ...base,
        type: 'payments.confirmed.v1',
        data: { ...base.data, confirmedBy: 'webhook' },
      };
    }

    if (input.gatewayStatus === 'failed') {
      const reason = input.reason ?? 'gateway webhook rejected payment';
      await client.query(
        `
        UPDATE payments
        SET status = $2,
            last_gateway_status = 'failed',
            last_error = $3,
            updated_at = now()
        WHERE id = $1
        `,
        [input.payment.id, PAYMENT_STATUS.FAILED, reason],
      );
      await client.query(
        `UPDATE orders SET status = $2, last_error = $3 WHERE id = $1`,
        [input.payment.order_id, ORDER_STATUS.CANCELED, reason],
      );

      return {
        ...base,
        type: 'payments.failed.v1',
        data: {
          ...base.data,
          reason,
          failedBy: 'webhook',
        },
      };
    }

    const reason = input.reason ?? 'gateway webhook returned unknown state';
    await client.query(
      `
      UPDATE payments
      SET status = $2,
          last_gateway_status = 'unknown',
          last_error = $3,
          next_verification_at = now(),
          updated_at = now()
      WHERE id = $1
      `,
      [input.payment.id, PAYMENT_STATUS.PENDING_VERIFICATION, reason],
    );
    await client.query(
      `UPDATE orders SET status = $2, last_error = $3 WHERE id = $1`,
      [input.payment.order_id, ORDER_STATUS.PENDING, reason],
    );

    return {
      ...base,
      type: 'payments.verification.requested.v1',
      data: {
        ...base.data,
        reason,
        attempt: 0,
      },
    };
  }

  private async insertOutboxEvent(
    client: PoolClient,
    event:
      | PaymentConfirmedEvent
      | PaymentFailedEvent
      | PaymentVerificationRequestedEvent,
  ) {
    const topicByType = {
      'payments.confirmed.v1': TOPICS.PAYMENT_CONFIRMED,
      'payments.failed.v1': TOPICS.PAYMENT_FAILED,
      'payments.verification.requested.v1':
        TOPICS.PAYMENT_VERIFICATION_REQUESTED,
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
