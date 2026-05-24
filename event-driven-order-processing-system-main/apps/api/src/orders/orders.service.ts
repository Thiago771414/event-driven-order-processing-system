import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { DbService } from '../db/db.service';
import { TOPICS } from '../messaging/topics';
import { MetricsService } from '../metrics/metrics.service';
import { PaymentGateway } from '../payments/payment-gateway';
import { PAYMENT_STATUS, PaymentStatus } from '../payments/payment-status';
import {
  PaymentConfirmedEvent,
  PaymentConfirmedEventSchema,
  PaymentFailedEvent,
  PaymentFailedEventSchema,
  PaymentVerificationRequestedEvent,
  PaymentVerificationRequestedEventSchema,
} from '../payments/payments.events';
import { CreateOrderSchema } from './dto';
import { ORDER_STATUS, OrderStatus } from './order-status';
import { calcTotal } from './orders.schema';
import { OrdersCreatedEvent } from './orders.events';

type ExistingOrderRow = {
  id: string;
  status: string;
  total: number | string;
  payment_status: string | null;
  gateway_transaction_reference: string | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DbService,
    private readonly metrics: MetricsService,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async createOrder(
    input: unknown,
    headers: { correlationId?: string; idempotencyKey?: string },
  ): Promise<{
    orderId: string;
    status: string;
    paymentStatus: string | null;
    gatewayTransactionReference: string | null;
    total: number;
  }> {
    const body = CreateOrderSchema.parse(input);

    const correlationId = headers.correlationId ?? randomUUID();
    const idempotencyKey = headers.idempotencyKey ?? randomUUID();

    const total = calcTotal(body.items);

    const existing = await this.db.pool.query<ExistingOrderRow>(
      `
      SELECT
        o.id,
        o.status,
        o.total,
        p.status AS payment_status,
        p.gateway_transaction_reference
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.idempotency_key = $1
      `,
      [idempotencyKey],
    );

    const existingRow = existing.rows[0];
    if (existingRow) {
      return {
        orderId: existingRow.id,
        status: existingRow.status,
        paymentStatus: existingRow.payment_status,
        gatewayTransactionReference: existingRow.gateway_transaction_reference,
        total: Number(existingRow.total),
      };
    }

    const orderId = randomUUID();
    const paymentId = randomUUID();
    const outboxId = randomUUID();

    const event: OrdersCreatedEvent = {
      eventId: randomUUID(),
      type: 'orders.created.v1',
      occurredAt: new Date().toISOString(),
      correlationId,
      idempotencyKey,
      data: {
        orderId,
        customerId: body.customerId,
        total,
        items: body.items,
      },
    };

    const paymentResult = await this.paymentGateway.charge({
      orderId,
      amount: total,
      idempotencyKey,
      requestedBehavior: body.payment?.gatewayBehavior,
    });

    const paymentTransition = this.buildPaymentTransition({
      orderId,
      paymentId,
      amount: total,
      correlationId,
      idempotencyKey,
      gatewayTransactionReference: paymentResult.transactionReference,
      gatewayStatus: paymentResult.status,
      reason: paymentResult.reason,
    });

    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `
        INSERT INTO orders (id, customer_id, total, status, idempotency_key, correlation_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          orderId,
          body.customerId,
          total,
          paymentTransition.orderStatus,
          idempotencyKey,
          correlationId,
        ],
      );

      await client.query(
        `
        INSERT INTO payments
          (
            id,
            order_id,
            idempotency_key,
            gateway_transaction_reference,
            status,
            amount,
            next_verification_at,
            last_gateway_status,
            last_error
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          paymentId,
          orderId,
          idempotencyKey,
          paymentResult.transactionReference,
          paymentTransition.paymentStatus,
          total,
          paymentTransition.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION
            ? new Date()
            : null,
          paymentResult.status,
          paymentResult.reason ?? null,
        ],
      );

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
          outboxId,
          'order',
          orderId,
          event.type,
          'orders.created',
          JSON.stringify(event),
          correlationId,
          idempotencyKey,
          orderId,
        ],
      );

      await this.insertPaymentOutboxEvent(client, paymentTransition.outboxEvent);

      await client.query('COMMIT');

      this.metrics.ordersCreated.inc();

      return {
        orderId,
        status: paymentTransition.orderStatus,
        paymentStatus: paymentTransition.paymentStatus,
        gatewayTransactionReference: paymentResult.transactionReference,
        total,
      };
    } catch (e: unknown) {
      await client.query('ROLLBACK');

      const err = e as { code?: string };
      if (err.code === '23505') {
        throw new ConflictException('Duplicate idempotency key');
      }

      throw e;
    } finally {
      client.release();
    }
  }

  private buildPaymentTransition(input: {
    orderId: string;
    paymentId: string;
    amount: number;
    correlationId: string;
    idempotencyKey: string;
    gatewayTransactionReference: string;
    gatewayStatus: 'confirmed' | 'failed' | 'unknown' | 'timeout';
    reason?: string;
  }): {
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    outboxEvent:
      | PaymentVerificationRequestedEvent
      | PaymentConfirmedEvent
      | PaymentFailedEvent;
  } {
    const base = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      data: {
        orderId: input.orderId,
        paymentId: input.paymentId,
        gatewayTransactionReference: input.gatewayTransactionReference,
        amount: input.amount,
      },
    };

    if (input.gatewayStatus === 'confirmed') {
      const outboxEvent: PaymentConfirmedEvent = {
        ...base,
        type: 'payments.confirmed.v1',
        data: {
          ...base.data,
          confirmedBy: 'checkout',
        },
      };
      const parsed = PaymentConfirmedEventSchema.safeParse(outboxEvent);
      if (!parsed.success) {
        throw new Error(`Invalid payments.confirmed payload: ${parsed.error.message}`);
      }
      return {
        orderStatus: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.CONFIRMED,
        outboxEvent,
      };
    }

    if (input.gatewayStatus === 'failed') {
      const outboxEvent: PaymentFailedEvent = {
        ...base,
        type: 'payments.failed.v1',
        data: {
          ...base.data,
          reason: input.reason ?? 'gateway rejected payment',
          failedBy: 'checkout',
        },
      };
      const parsed = PaymentFailedEventSchema.safeParse(outboxEvent);
      if (!parsed.success) {
        throw new Error(`Invalid payments.failed payload: ${parsed.error.message}`);
      }
      return {
        orderStatus: ORDER_STATUS.CANCELED,
        paymentStatus: PAYMENT_STATUS.FAILED,
        outboxEvent,
      };
    }

    const outboxEvent: PaymentVerificationRequestedEvent = {
      ...base,
      type: 'payments.verification.requested.v1',
      data: {
        ...base.data,
        reason: input.reason ?? 'gateway returned unknown state',
        attempt: 0,
      },
    };
    const parsed = PaymentVerificationRequestedEventSchema.safeParse(outboxEvent);
    if (!parsed.success) {
      throw new Error(
        `Invalid payments.verification.requested payload: ${parsed.error.message}`,
      );
    }
    return {
      orderStatus: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION,
      outboxEvent,
    };
  }

  private async insertPaymentOutboxEvent(
    client: PoolClient,
    event:
      | PaymentVerificationRequestedEvent
      | PaymentConfirmedEvent
      | PaymentFailedEvent,
  ) {
    const topicByType = {
      'payments.verification.requested.v1':
        TOPICS.PAYMENT_VERIFICATION_REQUESTED,
      'payments.confirmed.v1': TOPICS.PAYMENT_CONFIRMED,
      'payments.failed.v1': TOPICS.PAYMENT_FAILED,
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
