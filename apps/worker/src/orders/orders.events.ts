import { z } from 'zod';

export const OrdersCreatedEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal('orders.created.v1'),
  occurredAt: z.string().min(1),
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

export const OrdersProcessedEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal('orders.processed.v1'),
  occurredAt: z.string().min(1),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  data: z.object({
    orderId: z.string().min(1),
    status: z.literal('processed'),
  }),
});

export const OrdersCreatedDlqEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal('orders.created.dlq.v1'),
  occurredAt: z.string().min(1),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  attempts: z.number().int().nonnegative(),
  error: z.object({
    message: z.string().min(1),
    stack: z.string().optional(),
  }),
  originalEvent: OrdersCreatedEventSchema,
});
