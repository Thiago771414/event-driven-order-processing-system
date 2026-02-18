import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MetricsModule } from '../metrics/metrics.module';

import { OrdersRepository } from './orders.repository';
import { OrdersProcessor } from './orders.processor';
import { IdempotencyStore } from './idempotency.store';

import { KafkaConsumer } from '../messaging/consumer'; // ✅ ajuste o path se necessário

@Module({
  imports: [DbModule, MessagingModule, MetricsModule],
  providers: [
    OrdersRepository,
    OrdersProcessor,
    IdempotencyStore,
    KafkaConsumer,
  ], // ✅
})
export class OrdersModule {}
