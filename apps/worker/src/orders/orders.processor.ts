import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { KafkaClient } from '../messaging/kafka.client';
import { TOPICS } from '../messaging/topics';
import { IdempotencyStore } from './idempotency.store';
import {
  OrdersCreatedEvent,
  OrdersProcessedEventSchema,
  OrdersCreatedDlqEventSchema,
} from './orders.events';
import { MetricsService } from '../metrics/metrics.service';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { OrdersRepository } from './orders.repository';

const tracer = trace.getTracer('minishop-worker');

@Injectable()
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly kafka: KafkaClient,
    private readonly idem: IdempotencyStore,
    private readonly metrics: MetricsService,
    private readonly ordersRepo: OrdersRepository, // ✅ injetar OrdersRepository
  ) {}

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private backoffMs(attempt: number) {
    const base = 500;
    const max = 10_000;
    const ms = Math.min(max, base * Math.pow(2, attempt - 1));
    const jitter = Math.floor(Math.random() * 200);
    return ms + jitter;
  }

  async publishDlq(input: {
    originalEvent: OrdersCreatedEvent;
    attempts: number;
    error: { message: string; stack?: string };
  }) {
    const dlq = {
      eventId: randomUUID(),
      type: 'orders.created.dlq.v1' as const,
      occurredAt: new Date().toISOString(),
      correlationId: input.originalEvent.correlationId,
      idempotencyKey: input.originalEvent.idempotencyKey,
      attempts: input.attempts,
      error: input.error,
      originalEvent: input.originalEvent,
    };

    const ok = OrdersCreatedDlqEventSchema.safeParse(dlq);
    if (!ok.success)
      throw new Error(`Invalid DLQ payload: ${ok.error.message}`);

    // ✅ métrica: DLQ
    this.metrics.dlqTotal.inc();

    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({
      topic: TOPICS.ORDERS_CREATED_DLQ,
      messages: [{ value: JSON.stringify(dlq) }],
    });
    await producer.disconnect();
  }

  /**
   * Wrapper para processar com retry + DLQ
   */
  async processWithRetry(
    evt: OrdersCreatedEvent,
    opts?: { maxAttempts?: number },
  ) {
    const maxAttempts = opts?.maxAttempts ?? 5;

    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.handleOrdersCreated(evt);
        return;
      } catch (err) {
        lastErr = err;

        await this.ordersRepo.markFailed(
          evt.data.orderId,
          err instanceof Error ? err.message : String(err),
        );

        if (attempt < maxAttempts) {
          // ✅ métrica: retry
          this.metrics.retriesTotal.inc();

          const wait = this.backoffMs(attempt);
          this.logger.warn(
            `Retry attempt=${attempt}/${maxAttempts - 1} in ${wait}ms correlationId=${evt.correlationId} orderId=${evt.data.orderId} err=${err instanceof Error ? err.message : String(err)}`,
          );
          await this.sleep(wait);
          continue;
        }
      }
    }

    // estourou tentativas -> DLQ
    const e = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    await this.publishDlq({
      originalEvent: evt,
      attempts: maxAttempts,
      error: { message: e.message, stack: e.stack },
    });

    this.logger.error(
      `Sent to DLQ after ${maxAttempts} attempts correlationId=${evt.correlationId} orderId=${evt.data.orderId} err=${e.message}`,
    );
  }

  /**
   * Handler do evento: cria span + mede duração + chama processamento real
   */
  async handleOrdersCreated(evt: OrdersCreatedEvent) {
    return tracer.startActiveSpan(
      'process.orders.created',
      {
        attributes: {
          correlationId: evt.correlationId,
          eventType: evt.type,
          orderId: evt.data.orderId,
          idempotencyKey: evt.idempotencyKey,
        },
      },
      async (span) => {
        // ✅ timer Prometheus (ms)
        const endTimer = this.metrics.processingDuration.startTimer();

        try {
          await this.processOrder(evt);

          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (err as Error).message,
          });
          throw err;
        } finally {
          endTimer();
          span.end();
        }
      },
    );
  }

  /**
   * Processamento real (uma tentativa)
   * - idempotência
   * - publish orders.processed
   * - métricas de sucesso
   */
  private async processOrder(evt: OrdersCreatedEvent) {
    const orderId = evt.data.orderId;
    const key = `orders.created.v1:${evt.idempotencyKey}`;

    const existing = await this.idem.get(key);
    if (existing) {
      this.logger.warn(
        `Skipping duplicate idempotencyKey=${evt.idempotencyKey} orderId=${orderId}`,
      );
      return;
    }

    this.logger.log(
      `Processing orderId=${orderId} correlationId=${evt.correlationId}`,
    );

    const processed = {
      eventId: randomUUID(),
      type: 'orders.processed.v1' as const,
      occurredAt: new Date().toISOString(),
      correlationId: evt.correlationId,
      idempotencyKey: evt.idempotencyKey,
      data: { orderId, status: 'processed' as const },
    };

    const ok = OrdersProcessedEventSchema.safeParse(processed);
    if (!ok.success) {
      throw new Error(`Invalid orders.processed payload: ${ok.error.message}`);
    }

    const producer = this.kafka.producer();
    await producer.connect(); // (pode otimizar depois e manter conectado)

    await producer.send({
      topic: TOPICS.ORDERS_PROCESSED,
      messages: [
        {
          value: JSON.stringify(processed),
          headers: {
            'x-correlation-id': evt.correlationId,
            'x-idempotency-key': evt.idempotencyKey,
            'x-event-type': processed.type,
          },
        },
      ],
    });

    await producer.disconnect();

    await this.idem.set(key, {
      processedAt: new Date().toISOString(),
      orderId,
    });

    await this.ordersRepo.markProcessed(orderId);

    // ✅ métrica: processado com sucesso
    this.metrics.ordersProcessed.inc();

    this.logger.log(
      `Published ${TOPICS.ORDERS_PROCESSED} for orderId=${orderId}`,
    );
  }
}
