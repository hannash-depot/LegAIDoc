import { z } from 'zod/v4';

export const AdminDocumentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'PENDING_SIGNATURE', 'PUBLISHED', 'SIGNED', 'ARCHIVED']).optional(),
  wizardData: z.record(z.string(), z.unknown()).optional(),
  locale: z.enum(['he', 'ar', 'en', 'ru']).optional(),
});

export type AdminDocumentUpdateInput = z.infer<typeof AdminDocumentUpdateSchema>;
