import { Injectable } from '@nestjs/common';

export type PaymentGatewayBehavior =
  | 'confirmed'
  | 'failed'
  | 'unknown'
  | 'timeout';

export type PaymentGatewayChargeInput = {
  orderId: string;
  amount: number;
  idempotencyKey: string;
  requestedBehavior?: PaymentGatewayBehavior;
};

export type PaymentGatewayChargeResult = {
  status: PaymentGatewayBehavior;
  transactionReference: string;
  reason?: string;
};

@Injectable()
export class PaymentGateway {
  async charge(
    input: PaymentGatewayChargeInput,
  ): Promise<PaymentGatewayChargeResult> {
    const behavior =
      input.requestedBehavior ??
      (process.env.PAYMENT_GATEWAY_MODE as PaymentGatewayBehavior | undefined) ??
      'confirmed';

    const transactionReference = `gw_${input.idempotencyKey}`;

    if (behavior === 'timeout') {
      return {
        status: 'timeout',
        transactionReference,
        reason: 'gateway timeout',
      };
    }

    if (behavior === 'unknown') {
      return {
        status: 'unknown',
        transactionReference,
        reason: 'gateway returned unknown state',
      };
    }

    if (behavior === 'failed') {
      return {
        status: 'failed',
        transactionReference,
        reason: 'gateway rejected payment',
      };
    }

    return { status: 'confirmed', transactionReference };
  }
}
