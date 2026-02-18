import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DbService } from '../db/db.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateOrderSchema } from './dto';
import { calcTotal } from './orders.schema';
import { OrdersCreatedEvent } from './orders.events';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DbService,
    private readonly metrics: MetricsService,
  ) {}

  async createOrder(
    input: unknown,
    headers: { correlationId?: string; idempotencyKey?: string },
  ) {
    const body = CreateOrderSchema.parse(input);

    const correlationId = headers.correlationId ?? randomUUID();
    const idempotencyKey = headers.idempotencyKey ?? randomUUID();

    const total = calcTotal(body.items);

    // ✅ 1) idempotência (se já existe, devolve a mesma resposta)
    const existing = await this.db.pool.query(
      `SELECT id, status, total FROM orders WHERE idempotency_key = $1`,
      [idempotencyKey],
    );

    if (existing.rows[0]) {
      return {
        orderId: existing.rows[0].id,
        status: existing.rows[0].status,
        total: Number(existing.rows[0].total),
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

      // ✅ 2) grava o pedido
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

      // ✅ 3) grava o evento na outbox (Kafka pode estar fora que não perde)
      await client.query(
        `
        INSERT INTO outbox_events
          (id, aggregate_type, aggregate_id, event_type, topic, payload, correlation_id, idempotency_key)
        VALUES
          ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        `,
        [
          outboxId,
          'order',
          orderId,
          event.type, // "orders.created.v1"
          'orders.created', // topic lógico na outbox (ajuste se quiser usar TOPICS.ORDERS_CREATED)
          JSON.stringify(event),
          correlationId,
          idempotencyKey,
        ],
      );

      await client.query('COMMIT');

      // ✅ métrica: pedido criado (agora = gravado com segurança + outbox)
      this.metrics.ordersCreated.inc();

      return { orderId, status: 'created', total };
    } catch (e: any) {
      await client.query('ROLLBACK');

      // ✅ Postgres unique_violation (idempotency_key unique)
      if (e?.code === '23505') {
        throw new ConflictException('Duplicate idempotency key');
      }

      throw e;
    } finally {
      client.release();
    }
  }
}
