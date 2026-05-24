import { PaymentsProcessor } from './payments.processor';
import { PaymentVerificationRequestedEvent } from './payments.events';
import { TOPICS } from '../messaging/topics';

describe('PaymentsProcessor', () => {
  const event: PaymentVerificationRequestedEvent = {
    eventId: 'evt-1',
    type: 'payments.verification.requested.v1',
    occurredAt: '2026-05-20T00:00:00.000Z',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    data: {
      orderId: 'order-1',
      paymentId: 'payment-1',
      gatewayTransactionReference: 'gw-1',
      amount: 100,
      reason: 'timeout',
      attempt: 0,
    },
  };

  function makeProcessor() {
    const producer = {
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    };
    const kafka = {
      producer: jest.fn(() => producer),
    };
    const gateway = {
      lookupPayment: jest.fn(),
    };
    const idem = {
      tryAcquire: jest.fn().mockResolvedValue(true),
      release: jest.fn(),
    };
    const repo = {
      confirmPayment: jest.fn().mockResolvedValue(true),
      failPayment: jest.fn().mockResolvedValue(true),
      markVerificationFailure: jest.fn(),
    };
    const metrics = {
      paymentVerificationTotal: { inc: jest.fn() },
      paymentVerificationRetriesTotal: { inc: jest.fn() },
      paymentVerificationDlqTotal: { inc: jest.fn() },
      paymentVerificationDuration: { startTimer: jest.fn(() => jest.fn()) },
    };

    return {
      processor: new PaymentsProcessor(
        kafka as never,
        gateway as never,
        idem as never,
        repo as never,
        metrics as never,
      ),
      producer,
      gateway,
      idem,
      repo,
      metrics,
    };
  }

  it('retries an unknown lookup and confirms when the gateway recovers', async () => {
    const { processor, gateway, repo } = makeProcessor();
    gateway.lookupPayment
      .mockResolvedValueOnce({
        status: 'unknown',
        reason: 'gateway still unknown',
      })
      .mockResolvedValueOnce({ status: 'confirmed' });

    await processor.processVerificationWithRetry(event, {
      maxAttempts: 2,
      disableBackoff: true,
    });

    expect(repo.markVerificationFailure).toHaveBeenCalledTimes(1);
    expect(repo.confirmPayment).toHaveBeenCalledWith(event, 'worker');
  });

  it('cancels the order when retry finds a failed payment', async () => {
    const { processor, gateway, repo } = makeProcessor();
    gateway.lookupPayment.mockResolvedValue({
      status: 'failed',
      reason: 'card declined',
    });

    await processor.processVerificationWithRetry(event, {
      maxAttempts: 2,
      disableBackoff: true,
    });

    expect(repo.failPayment).toHaveBeenCalledWith(
      event,
      'card declined',
      'worker',
    );
    expect(repo.markVerificationFailure).not.toHaveBeenCalled();
  });

  it('sends the verification event to DLQ after retry exhaustion', async () => {
    const { processor, gateway, repo, producer } = makeProcessor();
    gateway.lookupPayment.mockRejectedValue(new Error('gateway timeout'));

    await processor.processVerificationWithRetry(event, {
      maxAttempts: 2,
      disableBackoff: true,
    });

    expect(repo.markVerificationFailure).toHaveBeenCalledTimes(2);
    expect(producer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: TOPICS.PAYMENT_VERIFICATION_DLQ,
      }),
    );
  });

  it('skips a duplicate in-flight payment verification attempt', async () => {
    const { processor, gateway, idem } = makeProcessor();
    idem.tryAcquire.mockResolvedValue(false);

    await processor.handleVerificationRequested(event);

    expect(gateway.lookupPayment).not.toHaveBeenCalled();
  });
});
