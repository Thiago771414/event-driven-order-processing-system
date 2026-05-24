import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { OutboxModule } from './outbox/outbox.module';
import { MetricsModule } from './metrics/metrics.module';
import { OrdersModule } from './orders/orders.module';
import { MessagingModule } from './messaging/messaging.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DbModule,
    MetricsModule,
    MessagingModule,
    OutboxModule,
    OrdersModule,
    AdminModule,
  ],
})
export class AppModule {}
