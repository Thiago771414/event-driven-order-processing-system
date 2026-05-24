import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Producer } from 'kafkajs';
import { KafkaClient } from '../messaging/kafka.client';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer!: Producer;

  constructor(private readonly kafka: KafkaClient) {}

  async onModuleInit() {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.logger.log('Producer connected');
  }

  async onModuleDestroy() {
    await this.producer?.disconnect();
  }

  async send(
    topic: string,
    payload: unknown,
    meta?: {
      correlationId?: string;
      idempotencyKey?: string;
      eventType?: string;
    },
  ) {
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
}
