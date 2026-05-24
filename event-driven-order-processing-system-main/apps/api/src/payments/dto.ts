import { z } from 'zod';

export const PaymentWebhookSchema = z
  .object({
    eventId: z.string().min(1),
    gatewayTransactionReference: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1).optional(),
    status: z.enum(['confirmed', 'failed', 'unknown']),
    reason: z.string().min(1).optional(),
  })
  .refine(
    (body) => body.gatewayTransactionReference || body.idempotencyKey,
    'gatewayTransactionReference or idempotencyKey is required',
  );

export type PaymentWebhookInput = z.infer<typeof PaymentWebhookSchema>;
