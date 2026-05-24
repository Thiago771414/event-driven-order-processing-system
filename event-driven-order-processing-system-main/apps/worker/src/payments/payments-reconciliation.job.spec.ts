import { PaymentsReconciliationJob } from './payments-reconciliation.job';

describe('PaymentsReconciliationJob', () => {
  const payment = {
    paymentId: 'payment-1',
    orderId: 'order-1',
    idempotencyKey: 'idem-1',
    gatewayTransactionReference: 'gw-1',
    amount: 100,
    correlationId: 'corr-1',
  };

  function makeJob() {
    const repo = {
      findPaymentsForReconciliation: jest.fn().mockResolvedValue([payment]),
      confirmPayment: jest.fn().mockResolvedValue(true),
      failPayment: jest.fn().mockResolvedValue(true),
      markReconciliationNeeded: jest.fn().mockResolvedValue(true),
      touchReconciliation: jest.fn(),
    };
    const gateway = {
      lookupPayment: jest.fn(),
    };
    const metrics = {
      paymentReconciliationTotal: { inc: jest.fn() },
    };

    return {
      job: new PaymentsReconciliationJob(
        repo as never,
        gateway as never,
        metrics as never,
      ),
      repo,
      gateway,
    };
  }

  it('confirms an internal pending payment that exists as paid in the gateway', async () => {
    const { job, repo, gateway } = makeJob();
    gateway.lookupPayment.mockResolvedValue({ status: 'confirmed' });

    await job.runOnce();

    expect(repo.confirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentId: payment.paymentId }),
      }),
      'reconciliation',
    );
    expect(repo.touchReconciliation).toHaveBeenCalledWith(payment.paymentId);
  });

  it('marks unknown reconciliation results for manual attention', async () => {
    const { job, repo, gateway } = makeJob();
    gateway.lookupPayment.mockResolvedValue({
      status: 'unknown',
      reason: 'gateway export missing record',
    });

    await job.runOnce();

    expect(repo.markReconciliationNeeded).toHaveBeenCalledWith(
      payment,
      'gateway export missing record',
    );
    expect(repo.touchReconciliation).toHaveBeenCalledWith(payment.paymentId);
  });
});
