import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MetricsModule } from '../metrics/metrics.module';

import { OrdersRepository } from './orders.repository';
import { OrdersProcessor } from './orders.processor';
import { RedisIdempotencyStore } from './redis-idempotency.store';

import { KafkaConsumer } from '../messaging/consumer';

@Module({
  imports: [DbModule, MessagingModule, MetricsModule],
  providers: [
    OrdersRepository,
    OrdersProcessor,
    RedisIdempotencyStore,
    KafkaConsumer,
  ],
})
export class OrdersModule {}