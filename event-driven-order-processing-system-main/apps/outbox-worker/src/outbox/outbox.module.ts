import { Module } from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { OutboxPublisher } from './outbox.publisher';
import { MessagingModule } from '../messaging/messaging.module';
import { DbModule } from '../db/db.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [DbModule, MessagingModule, MetricsModule],
  providers: [OutboxRepository, OutboxPublisher],
})
export class OutboxModule {}
