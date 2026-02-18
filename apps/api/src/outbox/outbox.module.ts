import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MetricsModule } from '../metrics/metrics.module';
import { OutboxRepository } from './outbox.repository';

@Module({
  imports: [DbModule, MessagingModule, MetricsModule], // ✅ traz DbService e KafkaProducer
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxModule {}
