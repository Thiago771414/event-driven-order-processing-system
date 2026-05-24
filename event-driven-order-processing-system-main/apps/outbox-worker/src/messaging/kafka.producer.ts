import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleDestroy {
  private kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'minishop-outbox-worker',
    brokers: resolveKafkaBrokers(
      process.env.KAFKA_BROKERS ?? process.env.KAFKA_BROKER,
    ),
  });

  private producer = this.kafka.producer();
  private connected = false;

  async send(record: ProducerRecord): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }

    await this.producer.send(record);
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }
}

function resolveKafkaBrokers(value?: string) {
  const brokers =
    value
      ?.split(',')
      .map((broker) => broker.trim())
      .filter(Boolean) ?? [];

  if (brokers.length === 0) {
    throw new Error(
      'Missing required environment variable KAFKA_BROKERS. Set KAFKA_BROKERS=localhost:9092 in the repository-root .env. KAFKA_BROKER is still accepted as a legacy alias.',
    );
  }

  return brokers;
}
