import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { getLlmSetting, updateLlmSetting, maskApiKey } from '@/lib/settings/llm-settings';
import { logAudit } from '@/lib/audit/audit-trail';
import { LlmSettingUpdateSchema, LLM_PROVIDERS } from '@/schemas/llm-setting';

/**
 * GET /api/admin/settings/llm
 * Returns current LLM settings (with masked keys).
 */
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const settings = await Promise.all(
      LLM_PROVIDERS.map(async (provider) => {
        const setting = await getLlmSetting(provider);
        return {
          provider,
          exists: !!setting,
          isActive: setting?.isActive ?? false,
          maskedKey: setting ? maskApiKey(setting.apiKey) : '',
        };
      }),
    );

    return success(settings);
  } catch (err) {
    logger.error('Failed to fetch LLM settings', err);
    return error('Internal server error', 500);
  }
}

/**
 * PATCH /api/admin/settings/llm
 * Updates an API key for a provider.
 */
export async function PATCH(request: NextRequest) {
  const { error: authError, session } = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = LlmSettingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const { provider, apiKey, isActive } = parsed.data;

    // Get existing to preserve values if not provided
    const existing = await getLlmSetting(provider);

    await updateLlmSetting({
      provider,
      apiKey: apiKey !== undefined ? apiKey : (existing?.apiKey ?? ''),
      isActive: isActive !== undefined ? isActive : (existing?.isActive ?? true),
    });

    await logAudit('settings.llm.update', 'llm_setting', provider, session!.user!.id!, {
      provider,
      isActiveUpdated: isActive !== undefined,
      keyUpdated: !!apiKey,
    });

    return success({ message: 'Setting updated successfully' });
  } catch (err) {
    logger.error('Failed to update LLM setting', err);
    return error('Internal server error', 500);
  }
}
