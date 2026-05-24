import { z } from 'zod';

export const ReprocessDtoSchema = z.object({
  originalEvent: z
    .object({
      correlationId: z.string(),
      idempotencyKey: z.string(),
      type: z.string(),
    })
    .catchall(z.unknown()),
});

export type ReprocessDto = z.infer<typeof ReprocessDtoSchema>;
