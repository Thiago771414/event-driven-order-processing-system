import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, Producer } from 'kafkajs';

@Injectable()
export class KafkaClient {
  private readonly kafka: Kafka;

  constructor(private readonly config: ConfigService) {
    const brokers = resolveKafkaBrokers(
      this.config.get<string>('KAFKA_BROKERS') ??
        this.config.get<string>('KAFKA_BROKER'),
    );
    const clientId =
      this.config.get<string>('KAFKA_CLIENT_ID') ?? 'minishop-worker';

    this.kafka = new Kafka({
      clientId,
      brokers,
    });
  }

  consumer(groupId: string): Consumer {
    return this.kafka.consumer({ groupId });
  }

  producer(): Producer {
    return this.kafka.producer();
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
