import { z } from 'zod/v4';

export const LLM_PROVIDERS = ['openai', 'claude', 'gemini'] as const;

export const LlmSettingUpdateSchema = z
  .object({
    provider: z.enum(LLM_PROVIDERS),
    apiKey: z.string().min(1).max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.apiKey !== undefined || data.isActive !== undefined, {
    message: 'Nothing to update',
  });

export type LlmSettingUpdateInput = z.infer<typeof LlmSettingUpdateSchema>;
