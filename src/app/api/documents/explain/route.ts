import { NextRequest } from 'next/server';
import { explainLegalText, LlmProvider } from '@/lib/ai/explainer';
import { getLlmSetting } from '@/lib/settings/llm-settings';
import { auth } from '@/auth';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';

const PROVIDER_ORDER: LlmProvider[] = ['gemini', 'claude', 'openai'];
const ENV_KEY_MAP: Record<LlmProvider, string> = {
  gemini: 'GOOGLE_AI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

async function pickProvider(): Promise<LlmProvider | null> {
  for (const p of PROVIDER_ORDER) {
    try {
      const setting = await getLlmSetting(p);
      if (setting?.isActive && setting.apiKey) return p;
    } catch {
      // ignore db fetch errors and fall through to env check
    }
    if (process.env[ENV_KEY_MAP[p]]) return p;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return error('Unauthorized', 401);
  }

  try {
    const body = await req.json();
    const { text, locale } = body;

    if (!text || typeof text !== 'string') {
      return error('Text is required for explanation.', 400);
    }

    const targetLocale = locale || 'en';

    const provider = await pickProvider();
    if (!provider) {
      return error('No LLM provider configured', 503);
    }

    const explanation = await explainLegalText(text, targetLocale, provider);

    return success({ explanation });
  } catch (err) {
    logger.error('API /api/documents/explain error', err);
    return error(
      `Failed to explain text: ${err instanceof Error ? err.message : String(err)}`,
      500,
    );
  }
}
