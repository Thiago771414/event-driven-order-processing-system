import { z } from 'zod';

const PaymentEventDataSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  gatewayTransactionReference: z.string().min(1),
  amount: z.number().nonnegative(),
});

const PaymentEventBaseSchema = z.object({
  eventId: z.string().min(1),
  occurredAt: z.string().min(1),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export const PaymentVerificationRequestedEventSchema =
  PaymentEventBaseSchema.extend({
    type: z.literal('payments.verification.requested.v1'),
    data: PaymentEventDataSchema.extend({
      reason: z.string().min(1),
      attempt: z.number().int().nonnegative().default(0),
    }),
  });

export const PaymentConfirmedEventSchema = PaymentEventBaseSchema.extend({
  type: z.literal('payments.confirmed.v1'),
  data: PaymentEventDataSchema.extend({
    confirmedBy: z.enum(['checkout', 'worker', 'webhook', 'reconciliation']),
  }),
});

export const PaymentFailedEventSchema = PaymentEventBaseSchema.extend({
  type: z.literal('payments.failed.v1'),
  data: PaymentEventDataSchema.extend({
    reason: z.string().min(1),
    failedBy: z.enum(['checkout', 'worker', 'webhook', 'reconciliation']),
  }),
});

export type PaymentVerificationRequestedEvent = z.infer<
  typeof PaymentVerificationRequestedEventSchema
>;
export type PaymentConfirmedEvent = z.infer<
  typeof PaymentConfirmedEventSchema
>;
export type PaymentFailedEvent = z.infer<typeof PaymentFailedEventSchema>;
