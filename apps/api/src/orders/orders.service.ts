import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DbService } from '../db/db.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateOrderSchema } from './dto';
import { calcTotal } from './orders.schema';
import { OrdersCreatedEvent } from './orders.events';

type ExistingOrderRow = {
  id: string;
  status: string;
  total: number | string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DbService,
    private readonly metrics: MetricsService,
  ) {}

  async createOrder(
    input: unknown,
    headers: { correlationId?: string; idempotencyKey?: string },
  ): Promise<{ orderId: string; status: string; total: number }> {
    const body = CreateOrderSchema.parse(input);

    const correlationId = headers.correlationId ?? randomUUID();
    const idempotencyKey = headers.idempotencyKey ?? randomUUID();

    const total = calcTotal(body.items);

    const existing = await this.db.pool.query<ExistingOrderRow>(
      `SELECT id, status, total FROM orders WHERE idempotency_key = $1`,
      [idempotencyKey],
    );

    const existingRow = existing.rows[0];
    if (existingRow) {
      return {
        orderId: existingRow.id,
        status: existingRow.status,
        total: Number(existingRow.total),
      };
    }

    const orderId = randomUUID();
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
          'created',
          idempotencyKey,
          correlationId,
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

      await client.query('COMMIT');

      this.metrics.ordersCreated.inc();

      return { orderId, status: 'created', total };
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
}