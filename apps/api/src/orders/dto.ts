import { z } from 'zod';

export const CreateOrderSchema = z.object({
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

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
