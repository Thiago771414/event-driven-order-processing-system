import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from './messaging/messaging.module';
import { MetricsModule } from './metrics/metrics.module';
import { DbModule } from './db/db.module';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    MessagingModule,
    MetricsModule,
    DbModule,
    OutboxModule,
  ],
})
export class AppModule {}