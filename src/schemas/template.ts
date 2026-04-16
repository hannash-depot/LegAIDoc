import { z } from 'zod/v4';
import { TemplateDefinition } from './template-definition';

const slugPattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export const TemplateCreateSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(slugPattern, 'Slug must be lowercase with hyphens only'),
  nameHe: z.string().min(1, 'Hebrew name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  nameRu: z.string().min(1, 'Russian name is required'),
  descHe: z.string().default(''),
  descAr: z.string().default(''),
  descEn: z.string().default(''),
  descRu: z.string().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  definition: TemplateDefinition,
  isActive: z.boolean().default(true),
});

export type TemplateCreateInput = z.infer<typeof TemplateCreateSchema>;

export const TemplateUpdateSchema = TemplateCreateSchema.partial();

export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>;
