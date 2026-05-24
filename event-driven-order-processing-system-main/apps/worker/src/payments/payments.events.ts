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

export type PaymentVerificationRequestedEvent = z.infer<
  typeof PaymentVerificationRequestedEventSchema
>;

export const PaymentConfirmedEventSchema = PaymentEventBaseSchema.extend({
  type: z.literal('payments.confirmed.v1'),
  data: PaymentEventDataSchema.extend({
    confirmedBy: z.enum(['checkout', 'worker', 'webhook', 'reconciliation']),
  }),
});

export type PaymentConfirmedEvent = z.infer<
  typeof PaymentConfirmedEventSchema
>;

export const PaymentFailedEventSchema = PaymentEventBaseSchema.extend({
  type: z.literal('payments.failed.v1'),
  data: PaymentEventDataSchema.extend({
    reason: z.string().min(1),
    failedBy: z.enum(['checkout', 'worker', 'webhook', 'reconciliation']),
  }),
});

export type PaymentFailedEvent = z.infer<typeof PaymentFailedEventSchema>;

export const PaymentReconciliationNeededEventSchema =
  PaymentEventBaseSchema.extend({
    type: z.literal('payments.reconciliation.needed.v1'),
    data: PaymentEventDataSchema.extend({
      reason: z.string().min(1),
    }),
  });

export type PaymentReconciliationNeededEvent = z.infer<
  typeof PaymentReconciliationNeededEventSchema
>;

export const PaymentVerificationDlqEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal('payments.verification.dlq.v1'),
  occurredAt: z.string().min(1),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  attempts: z.number().int().nonnegative(),
  error: z.object({
    message: z.string().min(1),
    stack: z.string().optional(),
  }),
  originalEvent: PaymentVerificationRequestedEventSchema,
});

export type PaymentVerificationDlqEvent = z.infer<
  typeof PaymentVerificationDlqEventSchema
>;
