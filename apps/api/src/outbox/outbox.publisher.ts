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
    setInterval(() => this.tick().catch(() => {}), this.intervalMs);
  }

  private async tick() {
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
            // se excedeu max_attempts => dead
            if (evt.attempts >= evt.max_attempts) {
              await this.repo.markDead(evt.id, 'max_attempts_reached');
              this.metrics.dlqTotal.inc(); // reaproveitando contador (ou crie outbox_dead_total)
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: 'max_attempts_reached',
              });
              span.end();
              return;
            }

            const payload =
              typeof evt.payload === 'string'
                ? JSON.parse(evt.payload)
                : evt.payload;

            await this.producer.send(evt.topic, evt.payload, {
              correlationId: evt.correlation_id,
              idempotencyKey: evt.idempotency_key,
              eventType: evt.event_type,
            });

            await this.repo.markSent(evt.id);
            this.metrics.ordersProcessed.inc(); // ou crie outbox_sent_total
            this.logger.log(`Outbox sent id=${evt.id} type=${evt.event_type}`);
            span.setStatus({ code: SpanStatusCode.OK });
          } catch (err: any) {
            const msg = err?.message ?? String(err);

            await this.repo.markFailed(evt.id, msg, this.baseBackoffMs);
            this.metrics.retriesTotal.inc(); // ou crie outbox_failed_total
            this.logger.error(`Outbox failed id=${evt.id}: ${msg}`);

            span.recordException(err);
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
