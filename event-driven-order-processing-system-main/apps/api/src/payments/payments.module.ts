import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PaymentGateway } from './payment-gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DbModule, MetricsModule],
  controllers: [PaymentsController],
  providers: [PaymentGateway, PaymentsService],
  exports: [PaymentGateway, PaymentsService],
})
export class PaymentsModule {}
