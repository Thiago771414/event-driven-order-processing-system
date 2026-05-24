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

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  metrics() {
    return this.registry.metrics();
  }
}
