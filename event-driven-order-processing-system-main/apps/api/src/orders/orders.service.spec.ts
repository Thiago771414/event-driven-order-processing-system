import { OrdersService } from './orders.service';
import { ORDER_STATUS } from './order-status';
import { PAYMENT_STATUS } from '../payments/payment-status';

describe('OrdersService payment consistency', () => {
  const input = {
    customerId: 'customer-1',
    items: [{ productId: 'sku-1', qty: 1, price: 100 }],
  };

  function makeService(options?: {
    existingRows?: unknown[];
    gatewayStatus?: 'confirmed' | 'failed' | 'unknown' | 'timeout';
  }) {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: jest.fn(),
    };
    const db = {
      pool: {
        query: jest
          .fn()
          .mockResolvedValue({ rows: options?.existingRows ?? [] }),
        connect: jest.fn().mockResolvedValue(client),
      },
    };
    const metrics = {
      ordersCreated: { inc: jest.fn() },
    };
    const gateway = {
      charge: jest.fn().mockResolvedValue({
        status: options?.gatewayStatus ?? 'confirmed',
        transactionReference: 'gw_idem-1',
        reason:
          options?.gatewayStatus === 'timeout'
            ? 'gateway timeout'
            : undefined,
      }),
    };

    return {
      service: new OrdersService(db as never, metrics as never, gateway as never),
      client,
      db,
      gateway,
    };
  }

  it('marks checkout timeout as pending verification and writes outbox', async () => {
    const { service, client } = makeService({ gatewayStatus: 'timeout' });

    const result = await service.createOrder(input, {
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
    });

    expect(result.status).toBe(ORDER_STATUS.PENDING);
    expect(result.paymentStatus).toBe(PAYMENT_STATUS.PENDING_VERIFICATION);
    expect(result.gatewayTransactionReference).toBe('gw_idem-1');

    const serializedQueries = client.query.mock.calls
      .map((call) => JSON.stringify(call))
      .join('\n');
    expect(serializedQueries).toContain(
      'payments.verification.requested.v1',
    );
    expect(serializedQueries).toContain('payments.verification.requested');
  });

  it('returns the existing order for a duplicate idempotency key', async () => {
    const { service, gateway } = makeService({
      existingRows: [
        {
          id: 'order-1',
          status: ORDER_STATUS.CONFIRMED,
          total: '100',
          payment_status: PAYMENT_STATUS.CONFIRMED,
          gateway_transaction_reference: 'gw_existing',
        },
      ],
    });

    const result = await service.createOrder(input, {
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
    });

    expect(result).toEqual({
      orderId: 'order-1',
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.CONFIRMED,
      gatewayTransactionReference: 'gw_existing',
      total: 100,
    });
    expect(gateway.charge).not.toHaveBeenCalled();
  });
});
