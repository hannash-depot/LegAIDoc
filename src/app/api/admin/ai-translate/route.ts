import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { MonolingualTemplate } from '@/schemas/template-definition';
import { translateTemplateToLanguage, type LlmProvider } from '@/lib/ai/llm-parser';
import { logAudit } from '@/lib/audit/audit-trail';

const VALID_LANGS = ['he', 'ar', 'en', 'ru'] as const;
const VALID_PROVIDERS: LlmProvider[] = ['openai', 'claude', 'gemini'];

/**
 * POST /api/admin/ai-translate
 * Translate a monolingual template into a single target language.
 */
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { template, targetLang, provider: rawProvider, apiKey } = body;

    if (!template) {
      return error('Missing template', 400, 'MISSING_TEMPLATE');
    }

    if (!targetLang || !VALID_LANGS.includes(targetLang)) {
      return error(
        `Invalid target language: ${targetLang}. Must be one of: ${VALID_LANGS.join(', ')}`,
        400,
        'INVALID_LANG',
      );
    }

    const provider: LlmProvider = VALID_PROVIDERS.includes(rawProvider) ? rawProvider : 'claude';

    // Validate template shape
    const templateValidation = MonolingualTemplate.safeParse(template);
    if (!templateValidation.success) {
      const issues = templateValidation.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return error(`Invalid template: ${issues}`, 400, 'INVALID_TEMPLATE');
    }

    const result = await translateTemplateToLanguage(
      templateValidation.data,
      targetLang,
      provider,
      apiKey || undefined,
    );

    await logAudit('ai.translate', 'template', null, session!.user!.id!, {
      targetLang,
      provider,
      confidence: result.confidence,
      errorCount: result.errors.length,
      translateTokens: result.tokenUsage?.translate,
    });

    return success({
      translation: result.definition,
      targetLang,
      confidence: result.confidence,
      errors: result.errors,
      errorKind: result.errorKind,
      rawResponse: result.rawResponse,
      tokenUsage: result.tokenUsage,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('AI translate error', err);

    await logAudit('ai.translate.error', 'template', null, session?.user?.id || 'system', {
      error: errorMessage,
    });

    return error(
      process.env.NODE_ENV === 'development'
        ? `AI translate error: ${errorMessage}`
        : 'Internal server error',
      500,
      'INTERNAL_ERROR',
    );
  }
}
