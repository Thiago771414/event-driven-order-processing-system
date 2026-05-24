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
    app_name: process.env.OTEL_SERVICE_NAME ?? 'minishop-api',
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

  readonly paymentWebhooksTotal = new Counter({
    name: 'payment_webhooks_total',
    help: 'Total payment webhooks handled',
    labelNames: ['status', 'result'] as const,
    registers: [this.registry],
  });

  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests handled by the API',
    labelNames: ['method', 'route', 'status_code', 'result'] as const,
    registers: [this.registry],
  });

  readonly processingDuration = new Histogram({
    name: 'orders_processing_duration_ms',
    help: 'Order processing duration in ms',
    buckets: [50, 100, 200, 500, 1000, 2000],
    registers: [this.registry],
  });

  readonly httpRequestDurationMs = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status_code', 'result'] as const,
    buckets: [25, 50, 100, 200, 500, 1000, 2000, 5000],
    registers: [this.registry],
  });

  constructor() {
    this.registry.setDefaultLabels(this.defaultLabels);
    collectDefaultMetrics({ register: this.registry });
  }

  recordHttpRequest(input: {
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
  }) {
    const result =
      input.statusCode >= 500
        ? 'server_error'
        : input.statusCode >= 400
          ? 'client_error'
          : 'success';

    const labels = {
      method: input.method,
      route: input.route,
      status_code: String(input.statusCode),
      result,
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationMs.observe(labels, input.durationMs);
  }

  metrics() {
    return this.registry.metrics();
  }
}
