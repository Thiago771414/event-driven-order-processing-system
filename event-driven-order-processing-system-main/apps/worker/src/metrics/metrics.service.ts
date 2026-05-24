import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly defaultLabels = {
    app_name: process.env.OTEL_SERVICE_NAME ?? 'minishop-worker',
    app_version: process.env.APP_VERSION ?? 'dev',
    deployment_version: process.env.DEPLOYMENT_VERSION ?? 'local',
    release_track: process.env.RELEASE_TRACK ?? 'stable',
    canary_cohort: process.env.CANARY_COHORT ?? 'none',
  };

  readonly ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Total number of orders created',
    registers: [this.registry],
  });

  readonly ordersProcessed = new Counter({
    name: 'orders_processed_total',
    help: 'Total number of orders processed',
    registers: [this.registry],
  });

  readonly retriesTotal = new Counter({
    name: 'orders_retries_total',
    help: 'Total retry attempts',
    registers: [this.registry],
  });

  readonly dlqTotal = new Counter({
    name: 'orders_dlq_total',
    help: 'Total messages sent to DLQ',
    registers: [this.registry],
  });

  readonly paymentVerificationTotal = new Counter({
    name: 'payment_verification_total',
    help: 'Total payment verification outcomes',
    labelNames: ['result'] as const,
    registers: [this.registry],
  });

  readonly paymentVerificationRetriesTotal = new Counter({
    name: 'payment_verification_retries_total',
    help: 'Total payment verification retry attempts',
    registers: [this.registry],
  });

  readonly paymentVerificationDlqTotal = new Counter({
    name: 'payment_verification_dlq_total',
    help: 'Total payment verification events sent to DLQ',
    registers: [this.registry],
  });

  readonly paymentReconciliationTotal = new Counter({
    name: 'payment_reconciliation_total',
    help: 'Total payment reconciliation outcomes',
    labelNames: ['result'] as const,
    registers: [this.registry],
  });

  readonly processingDuration = new Histogram({
    name: 'orders_processing_duration_ms',
    help: 'Order processing duration in ms',
    buckets: [50, 100, 200, 500, 1000, 2000],
    registers: [this.registry],
  });

  readonly paymentVerificationDuration = new Histogram({
    name: 'payment_verification_duration_ms',
    help: 'Payment verification duration in ms',
    buckets: [50, 100, 200, 500, 1000, 2000, 5000],
    registers: [this.registry],
  });

  get contentType() {
    return this.registry.contentType;
  }

  async getMetrics() {
    return this.registry.metrics();
  }

  constructor() {
    this.registry.setDefaultLabels(this.defaultLabels);
    collectDefaultMetrics({ register: this.registry });
  }

  metrics() {
    return this.registry.metrics();
  }
}
