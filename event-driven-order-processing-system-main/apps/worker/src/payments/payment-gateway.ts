import { Injectable } from '@nestjs/common';

export type GatewayPaymentLookupInput = {
  idempotencyKey: string;
  gatewayTransactionReference: string;
};

export type GatewayPaymentLookupResult =
  | { status: 'confirmed'; reason?: string }
  | { status: 'failed'; reason: string }
  | { status: 'not_found'; reason: string }
  | { status: 'unknown'; reason: string };

@Injectable()
export class PaymentGateway {
  async lookupPayment(
    input: GatewayPaymentLookupInput,
  ): Promise<GatewayPaymentLookupResult> {
    const mode = process.env.PAYMENT_GATEWAY_LOOKUP_MODE;
    const probe =
      `${mode ?? ''} ${input.gatewayTransactionReference} ${input.idempotencyKey}`.toLowerCase();

    if (probe.includes('timeout')) {
      throw new Error('gateway lookup timeout');
    }

    if (probe.includes('not_found')) {
      return { status: 'not_found', reason: 'gateway payment not found' };
    }

    if (probe.includes('failed')) {
      return { status: 'failed', reason: 'gateway rejected payment' };
    }

    if (probe.includes('unknown')) {
      return { status: 'unknown', reason: 'gateway still reports unknown' };
    }

    return { status: 'confirmed' };
  }
}
