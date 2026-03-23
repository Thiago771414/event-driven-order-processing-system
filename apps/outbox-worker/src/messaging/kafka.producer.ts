import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleDestroy {
  private kafka = new Kafka({
    clientId: 'minishop-outbox-worker',
    brokers: [process.env.KAFKA_BROKER!],
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