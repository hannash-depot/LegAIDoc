import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { TemplateDefinition, type TemplateDefinitionType } from '@/schemas/template-definition';
import { extractStrings, injectStrings } from '@/lib/ai/template-string-extractor';
import { translateStringMap } from '@/lib/ai/template-translator';
import type { LlmProvider, TokenUsage } from '@/lib/ai/llm-parser';
import { logAudit } from '@/lib/audit/audit-trail';

const VALID_PROVIDERS: LlmProvider[] = ['openai', 'claude', 'gemini'];
const TARGET_LANGS = ['ar', 'en', 'ru'] as const;

interface LangResult {
  lang: string;
  status: 'success' | 'error';
  error?: string;
  tokenUsage?: TokenUsage;
}

/**
 * POST /api/admin/ai-sync-languages
 * Translate all Hebrew strings in a template to AR/EN/RU.
 */
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { metadata, definition: rawDefinition, provider: rawProvider, apiKey } = body;

    const provider: LlmProvider = VALID_PROVIDERS.includes(rawProvider) ? rawProvider : 'claude';

    // Validate definition
    const defResult = TemplateDefinition.safeParse(rawDefinition);
    if (!defResult.success) {
      const issues = defResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return error(`Invalid definition: ${issues}`, 400, 'INVALID_DEFINITION');
    }

    const definition = defResult.data;

    // Extract all Hebrew strings
    const extracted = extractStrings(metadata, definition, 'he');

    if (extracted.entries.length === 0) {
      return error('No Hebrew strings found to translate', 400, 'NO_STRINGS');
    }

    // Translate to all target languages in parallel
    const results = await Promise.allSettled(
      TARGET_LANGS.map(async (lang): Promise<LangResult> => {
        try {
          const result = await translateStringMap(
            extracted.map,
            lang,
            provider,
            apiKey || undefined,
          );

          // Inject translated strings back into the definition
          // We need a deep clone per language since they all modify the same definition
          injectStrings(metadata, definition, lang, extracted.entries, result.translatedMap);

          return { lang, status: 'success', tokenUsage: result.tokenUsage };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { lang, status: 'error', error: message };
        }
      }),
    );

    const langResults: LangResult[] = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { lang: '?', status: 'error' as const, error: 'Promise rejected' },
    );

    const successCount = langResults.filter((r) => r.status === 'success').length;
    const totalTokens = langResults.reduce(
      (acc, r) => ({
        inputTokens: acc.inputTokens + (r.tokenUsage?.inputTokens ?? 0),
        outputTokens: acc.outputTokens + (r.tokenUsage?.outputTokens ?? 0),
      }),
      { inputTokens: 0, outputTokens: 0 },
    );

    await logAudit('ai.sync-languages', 'template', null, session!.user!.id!, {
      provider,
      stringCount: extracted.entries.length,
      successCount,
      totalLangs: TARGET_LANGS.length,
      totalTokens,
    });

    return success({
      metadata,
      definition: definition as TemplateDefinitionType,
      languages: langResults,
      stringCount: extracted.entries.length,
      tokenUsage: totalTokens,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('AI sync languages error', err);

    await logAudit('ai.sync-languages.error', 'template', null, session?.user?.id || 'system', {
      error: errorMessage,
    });

    return error(
      process.env.NODE_ENV === 'development'
        ? `AI sync error: ${errorMessage}`
        : 'Internal server error',
      500,
      'INTERNAL_ERROR',
    );
  }
}
