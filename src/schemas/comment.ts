import { z } from 'zod/v4';

export const CommentUpdateSchema = z.object({
  resolved: z.boolean(),
});

export type CommentUpdateInput = z.infer<typeof CommentUpdateSchema>;
