import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { KafkaProducer } from '../messaging/kafka.producer';
import { MetricsService } from '../metrics/metrics.service';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('minishop-api');

@Injectable()
export class OutboxPublisher implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisher.name);

  private readonly intervalMs = Number(
    process.env.OUTBOX_PUBLISH_INTERVAL_MS ?? 1000,
  );
  private readonly batchSize = Number(process.env.OUTBOX_BATCH_SIZE ?? 20);
  private readonly lockTtlSec = Number(process.env.OUTBOX_LOCK_TTL_SEC ?? 30);
  private readonly lockerId = process.env.OUTBOX_LOCKER_ID ?? 'api-local';
  private readonly baseBackoffMs = Number(
    process.env.OUTBOX_BASE_BACKOFF_MS ?? 500,
  );

  constructor(
    private readonly repo: OutboxRepository,
    private readonly producer: KafkaProducer,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit() {
    if (process.env.OUTBOX_PUBLISHER_ENABLED !== 'true') {
      this.logger.log('[OUTBOX] API publisher disabled by env');
      return;
    }

    setInterval(() => {
      this.tick().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[OUTBOX] tick failed: ${msg}`);
      });
    }, this.intervalMs);
  }

  private async tick(): Promise<void> {
    const events = await this.repo.claimBatch(
      this.batchSize,
      this.lockerId,
      this.lockTtlSec,
    );
    if (!events.length) return;

    for (const evt of events) {
      await tracer.startActiveSpan(
        'outbox.publish',
        {
          attributes: {
            outboxId: evt.id,
            eventType: evt.event_type,
            topic: evt.topic,
            correlationId: evt.correlation_id,
            idempotencyKey: evt.idempotency_key,
            attempts: evt.attempts,
          },
        },
        async (span) => {
          const endTimer = this.metrics.processingDuration.startTimer();

          try {
            if (evt.attempts >= evt.max_attempts) {
              await this.repo.markDead(evt.id, 'max_attempts_reached');
              this.metrics.dlqTotal.inc();
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: 'max_attempts_reached',
              });
              return;
            }

            const payload: unknown =
              typeof evt.payload === 'string'
                ? JSON.parse(evt.payload)
                : evt.payload;

            await this.producer.send(evt.topic, payload, {
              correlationId: evt.correlation_id,
              idempotencyKey: evt.idempotency_key,
              eventType: evt.event_type,
            });

            await this.repo.markSent(evt.id);
            this.metrics.ordersProcessed.inc();
            this.logger.log(`Outbox sent id=${evt.id} type=${evt.event_type}`);
            span.setStatus({ code: SpanStatusCode.OK });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);

            await this.repo.markFailed(evt.id, msg, this.baseBackoffMs);
            this.metrics.retriesTotal.inc();
            this.logger.error(`Outbox failed id=${evt.id}: ${msg}`);

            span.recordException(err instanceof Error ? err : new Error(msg));
            span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
          } finally {
            endTimer();
            span.end();
          }
        },
      );
    }
  }
}