import { Injectable, Logger } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
import { KafkaClient } from '../messaging/kafka.client';
import { TOPICS } from '../messaging/topics';
import { MetricsService } from '../metrics/metrics.service';
import { RedisIdempotencyStore } from '../orders/redis-idempotency.store';
import { PaymentGateway } from './payment-gateway';
import {
  PaymentVerificationDlqEventSchema,
  PaymentVerificationRequestedEvent,
} from './payments.events';
import { PaymentsRepository } from './payments.repository';

const tracer = trace.getTracer('minishop-payment-worker');

const releaseAttributes = {
  'service.version': process.env.APP_VERSION ?? 'dev',
  'deployment.version': process.env.DEPLOYMENT_VERSION ?? 'local',
  'release.track': process.env.RELEASE_TRACK ?? 'stable',
  'canary.cohort': process.env.CANARY_COHORT ?? 'none',
};

@Injectable()
export class PaymentsProcessor {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(
    private readonly kafka: KafkaClient,
    private readonly gateway: PaymentGateway,
    private readonly idem: RedisIdempotencyStore,
    private readonly repo: PaymentsRepository,
    private readonly metrics: MetricsService,
  ) {}

  async processVerificationWithRetry(
    evt: PaymentVerificationRequestedEvent,
    opts?: { maxAttempts?: number; disableBackoff?: boolean },
  ): Promise<void> {
    const maxAttempts = opts?.maxAttempts ?? 5;
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.handleVerificationRequested(evt);
        return;
      } catch (err) {
        lastErr = err;
        const error = err instanceof Error ? err.message : String(err);
        await this.repo.markVerificationFailure(evt.data.paymentId, error);

        if (attempt < maxAttempts) {
          this.metrics.paymentVerificationRetriesTotal.inc();
          const wait = opts?.disableBackoff ? 0 : this.backoffMs(attempt);
          this.logger.warn(
            `Payment verification retry attempt=${attempt}/${maxAttempts - 1} in ${wait}ms correlationId=${evt.correlationId} paymentId=${evt.data.paymentId} err=${error}`,
          );
          await this.sleep(wait);
        }
      }
    }

    const e = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    await this.publishDlq({
      originalEvent: evt,
      attempts: maxAttempts,
      error: { message: e.message, stack: e.stack },
    });

    this.metrics.paymentVerificationDlqTotal.inc();
    this.metrics.paymentVerificationTotal.inc({ result: 'dlq' });

    this.logger.error(
      `Payment verification sent to DLQ correlationId=${evt.correlationId} paymentId=${evt.data.paymentId} err=${e.message}`,
    );
  }

  async handleVerificationRequested(
    evt: PaymentVerificationRequestedEvent,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      tracer.startActiveSpan(
        'payments.verify',
        {
          attributes: {
            ...releaseAttributes,
            correlationId: evt.correlationId,
            eventType: evt.type,
            orderId: evt.data.orderId,
            paymentId: evt.data.paymentId,
            gatewayTransactionReference:
              evt.data.gatewayTransactionReference,
            idempotencyKey: evt.idempotencyKey,
          },
        },
        (span) => {
          void (async () => {
            const endTimer =
              this.metrics.paymentVerificationDuration.startTimer();

            try {
              await this.verifyPayment(evt);
              span.setStatus({ code: SpanStatusCode.OK });
              resolve();
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              reject(error);
            } finally {
              endTimer();
              span.end();
            }
          })();
        },
      );
    });
  }

  private async verifyPayment(evt: PaymentVerificationRequestedEvent) {
    const lockKey = `payments.verification.lock:${evt.data.paymentId}`;
    const claimed = await this.idem.tryAcquire(lockKey, 30_000);

    if (!claimed) {
      this.metrics.paymentVerificationTotal.inc({ result: 'duplicate' });
      this.logger.warn(
        `Skipping duplicate payment verification paymentId=${evt.data.paymentId} correlationId=${evt.correlationId}`,
      );
      return;
    }

    try {
      const lookup = await this.gateway.lookupPayment({
        idempotencyKey: evt.idempotencyKey,
        gatewayTransactionReference: evt.data.gatewayTransactionReference,
      });

      if (lookup.status === 'confirmed') {
        const changed = await this.repo.confirmPayment(evt, 'worker');
        this.metrics.paymentVerificationTotal.inc({
          result: changed ? 'confirmed' : 'already_terminal',
        });
        return;
      }

      if (lookup.status === 'failed' || lookup.status === 'not_found') {
        const changed = await this.repo.failPayment(
          evt,
          lookup.reason,
          'worker',
        );
        this.metrics.paymentVerificationTotal.inc({
          result: changed ? 'failed' : 'already_terminal',
        });
        return;
      }

      this.metrics.paymentVerificationTotal.inc({ result: 'unknown' });
      throw new Error(lookup.reason);
    } finally {
      await this.idem.release(lockKey);
    }
  }

  private async publishDlq(input: {
    originalEvent: PaymentVerificationRequestedEvent;
    attempts: number;
    error: { message: string; stack?: string };
  }) {
    const dlq = {
      eventId: randomUUID(),
      type: 'payments.verification.dlq.v1' as const,
      occurredAt: new Date().toISOString(),
      correlationId: input.originalEvent.correlationId,
      idempotencyKey: input.originalEvent.idempotencyKey,
      attempts: input.attempts,
      error: input.error,
      originalEvent: input.originalEvent,
    };

    const parsed = PaymentVerificationDlqEventSchema.safeParse(dlq);
    if (!parsed.success) {
      throw new Error(
        `Invalid payments.verification.dlq payload: ${parsed.error.message}`,
      );
    }

    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({
      topic: TOPICS.PAYMENT_VERIFICATION_DLQ,
      messages: [{ value: JSON.stringify(dlq) }],
    });
    await producer.disconnect();
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private backoffMs(attempt: number) {
    const base = 500;
    const max = 10_000;
    const ms = Math.min(max, base * Math.pow(2, attempt - 1));
    const jitter = Math.floor(Math.random() * 200);
    return ms + jitter;
  }
}
