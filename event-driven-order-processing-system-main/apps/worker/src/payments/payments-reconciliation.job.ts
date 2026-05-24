import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MetricsService } from '../metrics/metrics.service';
import { PaymentGateway } from './payment-gateway';
import { PaymentVerificationRequestedEvent } from './payments.events';
import {
  PaymentRecord,
  PaymentsRepository,
} from './payments.repository';

@Injectable()
export class PaymentsReconciliationJob
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentsReconciliationJob.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly gateway: PaymentGateway,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit() {
    if (process.env.PAYMENT_RECONCILIATION_ENABLED === 'false') {
      this.logger.log('Payment reconciliation disabled');
      return;
    }

    const intervalMs = Number(
      process.env.PAYMENT_RECONCILIATION_INTERVAL_MS ?? 60_000,
    );

    this.timer = setInterval(() => {
      this.runOnce().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Payment reconciliation failed: ${msg}`);
      });
    }, intervalMs);

    this.logger.log(`Payment reconciliation started intervalMs=${intervalMs}`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(limit = 50): Promise<void> {
    const payments = await this.repo.findPaymentsForReconciliation(limit);

    for (const payment of payments) {
      await this.reconcilePayment(payment);
    }
  }

  private async reconcilePayment(payment: PaymentRecord): Promise<void> {
    const event = this.toVerificationEvent(payment);

    try {
      const lookup = await this.gateway.lookupPayment({
        idempotencyKey: payment.idempotencyKey,
        gatewayTransactionReference: payment.gatewayTransactionReference,
      });

      if (lookup.status === 'confirmed') {
        const changed = await this.repo.confirmPayment(event, 'reconciliation');
        this.metrics.paymentReconciliationTotal.inc({
          result: changed ? 'confirmed' : 'already_terminal',
        });
        return;
      }

      if (lookup.status === 'failed' || lookup.status === 'not_found') {
        const changed = await this.repo.failPayment(
          event,
          lookup.reason,
          'reconciliation',
        );
        this.metrics.paymentReconciliationTotal.inc({
          result: changed ? 'failed' : 'already_terminal',
        });
        return;
      }

      await this.repo.markReconciliationNeeded(payment, lookup.reason);
      this.metrics.paymentReconciliationTotal.inc({
        result: 'needs_attention',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.repo.markReconciliationNeeded(payment, msg);
      this.metrics.paymentReconciliationTotal.inc({
        result: 'lookup_error',
      });
      this.logger.warn(
        `Payment reconciliation marked for attention paymentId=${payment.paymentId} err=${msg}`,
      );
    } finally {
      await this.repo.touchReconciliation(payment.paymentId);
    }
  }

  private toVerificationEvent(
    payment: PaymentRecord,
  ): PaymentVerificationRequestedEvent {
    return {
      eventId: randomUUID(),
      type: 'payments.verification.requested.v1',
      occurredAt: new Date().toISOString(),
      correlationId: payment.correlationId,
      idempotencyKey: payment.idempotencyKey,
      data: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        gatewayTransactionReference: payment.gatewayTransactionReference,
        amount: payment.amount,
        reason: 'batch reconciliation',
        attempt: 0,
      },
    };
  }
}
