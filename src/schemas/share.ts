import { z } from 'zod/v4';

export const SharePermissionSchema = z.enum(['VIEW', 'COMMENT']);

export const ShareCreateSchema = z.object({
  permission: SharePermissionSchema.default('VIEW'),
});

export type ShareCreateInput = z.infer<typeof ShareCreateSchema>;
