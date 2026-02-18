import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleDestroy {
  private kafka = new Kafka({
    clientId: 'minishop-outbox-worker',
    brokers: [process.env.KAFKA_BROKER!],
  });

  private producer = this.kafka.producer();
  private connected = false;

  async send(
    topic: string,
    payload: unknown,
    meta?: {
      correlationId?: string;
      idempotencyKey?: string;
      eventType?: string;
    },
  ) {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }

    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(payload),
          headers: {
            'x-correlation-id': meta?.correlationId ?? '',
            'x-idempotency-key': meta?.idempotencyKey ?? '',
            'x-event-type': meta?.eventType ?? '',
          },
        },
      ],
    });
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }
}
