import { z } from 'zod';

export const CreateOrderBodySchema = z.object({
  customerId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
        price: z.number().positive(),
      }),
    )
    .min(1),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;

export type OrderCreatedEvent = {
  eventName: 'orders.created';
  eventVersion: 1;
  id: string; // eventId
  occurredAt: string;
  data: {
    orderId: string;
    customerId: string;
    total: number;
    items: Array<{ productId: string; qty: number; price: number }>;
  };
};
