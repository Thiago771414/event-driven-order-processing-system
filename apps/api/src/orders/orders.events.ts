import { z } from 'zod';

export const OrdersCreatedEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal('orders.created.v1'),
  occurredAt: z.string().min(1), // ISO
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  data: z.object({
    orderId: z.string().min(1),
    customerId: z.string().min(1),
    total: z.number().nonnegative(),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
        price: z.number().positive(),
      }),
    ),
  }),
});

export type OrdersCreatedEvent = z.infer<typeof OrdersCreatedEventSchema>;
