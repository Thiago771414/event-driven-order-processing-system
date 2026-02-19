import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { KafkaProducer } from '../messaging/kafka.producer';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly repo: OutboxRepository,
    private readonly producer: KafkaProducer,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit() {
    // polling simples (ex: a cada 1s)
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error(err);
      });
    }, 1000);

    this.logger.log('[OUTBOX] Publisher started');
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    // 1) lag da fila (antes de processar)
    const oldest = await this.repo.getOldestPendingCreatedAt();
    if (!oldest) {
      this.metrics.outboxLagSeconds.set(0);
    } else {
      const lagSeconds = Math.max(0, (Date.now() - oldest.getTime()) / 1000);
      this.metrics.outboxLagSeconds.set(lagSeconds);
    }

    const events = await this.repo.fetchPending(50);

    for (const evt of events) {
      this.metrics.outboxInflight.inc();

      try {
        await this.producer.send(evt.topic, evt.payload, {
          correlationId: evt.correlationId,
          idempotencyKey: evt.idempotencyKey,
          eventType: evt.eventType,
        });

        await this.repo.markPublished(evt.id);

        this.metrics.outboxSentTotal.inc({
          event_type: evt.eventType,
          topic: evt.topic,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        await this.repo.markFailed(evt.id, msg);

        this.metrics.outboxFailedTotal.inc({
          event_type: evt.eventType,
          topic: evt.topic,
        });

        this.logger.error(
          `[OUTBOX] publish failed id=${evt.id} topic=${evt.topic} err=${msg}`,
        );
      } finally {
        this.metrics.outboxInflight.dec();
      }
    }
  }
}
