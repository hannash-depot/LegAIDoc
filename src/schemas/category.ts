import { z } from 'zod/v4';

const slugPattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export const CategoryCreateSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(slugPattern, 'Slug must be lowercase with hyphens only'),
  nameHe: z.string().min(1, 'Hebrew name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  nameRu: z.string().min(1, 'Russian name is required'),
  descHe: z.string().default(''),
  descAr: z.string().default(''),
  descEn: z.string().default(''),
  descRu: z.string().default(''),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;
