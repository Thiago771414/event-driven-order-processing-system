import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Producer } from 'kafkajs';
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

  async send(topic: string, value: unknown) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(value) }],
    });
  }
}
