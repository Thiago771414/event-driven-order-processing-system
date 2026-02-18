import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { DbModule } from '../db/db.module';
import { MetricsModule } from '../metrics/metrics.module';
import { OutboxModule } from '../outbox/outbox.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MessagingModule, // KafkaProducer (se ainda usa direto)
    DbModule, // DbService
    MetricsModule, // MetricsService
    OutboxModule, // OutboxRepository/OutboxPublisher (se OrdersService usa)
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
