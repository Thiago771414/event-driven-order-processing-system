import { Injectable } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly defaultLabels = {
    app_name: process.env.OTEL_SERVICE_NAME ?? 'minishop-outbox-worker',
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

  readonly processingDuration = new Histogram({
    name: 'orders_processing_duration_ms',
    help: 'Order processing duration in ms',
    buckets: [50, 100, 200, 500, 1000, 2000],
    registers: [this.registry],
  });

  readonly outboxSentTotal = new Counter({
    name: 'outbox_sent_total',
    help: 'Total outbox events sent',
    labelNames: ['event_type', 'topic'] as const,
    registers: [this.registry],
  });

  readonly outboxFailedTotal = new Counter({
    name: 'outbox_failed_total',
    help: 'Total outbox publish failures',
    labelNames: ['event_type', 'topic'] as const,
    registers: [this.registry],
  });

  readonly outboxInflight = new Gauge({
    name: 'outbox_inflight',
    help: 'Outbox events currently being published',
    registers: [this.registry],
  });

  readonly outboxLagSeconds = new Gauge({
    name: 'outbox_lag_seconds',
    help: 'Lag in seconds of oldest pending outbox event',
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
