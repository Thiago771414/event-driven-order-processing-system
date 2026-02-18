import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive(),
  price: z.number().positive(),
});

export const CreateOrderBodySchema = z.object({
  customerId: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;

export function calcTotal(items: Array<z.infer<typeof OrderItemSchema>>) {
  return items.reduce((acc, it) => acc + it.qty * it.price, 0);
}
