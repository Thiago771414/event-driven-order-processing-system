import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaClient {
  private readonly kafka: Kafka;

  constructor(private readonly config: ConfigService) {
    const broker = this.config.get<string>('KAFKA_BROKER') ?? 'localhost:9092';
    this.kafka = new Kafka({
      clientId: 'minishop-worker',
      brokers: [broker],
    });
  }

  consumer(groupId: string) {
    return this.kafka.consumer({ groupId });
  }

  producer() {
    return this.kafka.producer();
  }
}
