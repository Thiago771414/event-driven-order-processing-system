import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MetricsModule } from '../metrics/metrics.module';
import { RedisIdempotencyStore } from '../orders/redis-idempotency.store';
import { PaymentGateway } from './payment-gateway';
import { PaymentsReconciliationJob } from './payments-reconciliation.job';
import { PaymentsProcessor } from './payments.processor';
import { PaymentsRepository } from './payments.repository';

@Module({
  imports: [DbModule, MessagingModule, MetricsModule],
  providers: [
    PaymentGateway,
    PaymentsProcessor,
    PaymentsRepository,
    PaymentsReconciliationJob,
    RedisIdempotencyStore,
  ],
  exports: [PaymentsProcessor],
})
export class PaymentsModule {}
