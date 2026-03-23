import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Consumer } from 'kafkajs';
import { KafkaClient } from '../messaging/kafka.client';
import { TOPICS } from './topics';
import { OrdersProcessor } from '../orders/orders.processor';
import {
  OrdersCreatedEventSchema,
  OrdersCreatedDlqEventSchema,
} from '../orders/orders.events';

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly kafka: KafkaClient,
    private readonly orders: OrdersProcessor,
  ) {}

  async onModuleInit() {
    const fromBeginning = process.env.KAFKA_FROM_BEGINNING === 'true';

    this.consumer = this.kafka.consumer('minishop-worker-group');

    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: TOPICS.ORDERS_CREATED,
      fromBeginning,
    });

    await this.consumer.subscribe({
      topic: TOPICS.ORDERS_CREATED_DLQ,
      fromBeginning,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value?.toString() ?? '';
        if (!raw) return;

        let json: unknown;
        try {
          json = JSON.parse(raw);
        } catch {
          this.logger.error(`Invalid JSON on ${topic}: ${raw}`);
          return;
        }

        if (topic === TOPICS.ORDERS_CREATED_DLQ) {
          const parsedDlq = OrdersCreatedDlqEventSchema.safeParse(json);
          if (!parsedDlq.success) {
            this.logger.error(
              `Invalid DLQ payload: ${parsedDlq.error.message}`,
            );
            return;
          }

          const evt = parsedDlq.data;
          this.logger.warn(
            `DLQ message received correlationId=${evt.correlationId} attempts=${evt.attempts} orderId=${evt.originalEvent?.data?.orderId ?? '?'}`,
          );
          return;
        }

        const parsed = OrdersCreatedEventSchema.safeParse(json);
        if (!parsed.success) {
          this.logger.error(
            `Invalid payload on ${topic}: ${parsed.error.message}`,
          );
          return;
        }

        const evt = parsed.data;

        try {
          await this.orders.processWithRetry(evt);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Unhandled error processing message correlationId=${evt.correlationId} orderId=${evt.data.orderId} err=${msg}`,
          );
        }
      },
    });

    this.logger.log(
      `Consuming: ${TOPICS.ORDERS_CREATED} + ${TOPICS.ORDERS_CREATED_DLQ} fromBeginning=${fromBeginning}`,
    );
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }
}