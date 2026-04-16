import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLlmSetting } from '@/lib/settings/llm-settings';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

export type LlmProvider = 'openai' | 'claude' | 'gemini';

const LLM_TIMEOUT_MS = 60_000;

const ENV_KEY_MAP: Record<LlmProvider, string> = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
};

async function resolveApiKey(provider: LlmProvider, apiKey?: string): Promise<string> {
  let key = apiKey;

  if (!key) {
    const dbSetting = await getLlmSetting(provider);
    if (dbSetting?.isActive && dbSetting.apiKey) {
      key = dbSetting.apiKey;
    }
  }

  if (!key) {
    key = process.env[ENV_KEY_MAP[provider]];
  }

  if (!key) {
    throw new Error(
      `API key not provided for ${provider}. Set ${ENV_KEY_MAP[provider]} environment variable or provide one in the UI.`,
    );
  }

  return key.replace(/[\u2022\u200B-\u200D\uFEFF]/g, '').trim();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenAI(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create(
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 500,
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return content;
}

async function callClaude(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create(
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Empty response from Claude');
  return block.text;
}

async function callGemini(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
    },
  });

  const result = await Promise.race([
    model.generateContent(userContent),
    delay(LLM_TIMEOUT_MS).then(() => {
      throw new Error('Gemini request timed out');
    }),
  ]);
  const content = result.response.text();
  if (!content) throw new Error('Empty response from Gemini');

  return content;
}

const PROVIDER_FN: Record<
  LlmProvider,
  (system: string, user: string, key: string) => Promise<string>
> = {
  openai: callOpenAI,
  claude: callClaude,
  gemini: callGemini,
};

export async function explainLegalText(
  text: string,
  locale: string,
  provider: LlmProvider = 'gemini',
  apiKey?: string,
): Promise<string> {
  const langNames: Record<string, string> = {
    he: 'Hebrew',
    ar: 'Arabic',
    en: 'English',
    ru: 'Russian',
  };

  const langName = langNames[locale] || locale;

  const systemPrompt = `You are a knowledgeable legal expert whose goal is to explain complex legal text in simple terms so anyone can understand it. Your explanation should be tailored for a non-lawyer reading the document.
Explain the core meaning of the selected text in exactly the following language: ${langName}.
Keep it concise: maximum 3 short sentences.`;

  const userContent = `Explain the following legal text:

"${text}"

Explanation:`;

  const key = await resolveApiKey(provider, apiKey);
  const callFn = PROVIDER_FN[provider];

  try {
    const result = await callFn(systemPrompt, userContent, key);
    return result.trim();
  } catch (error) {
    logger.error('Failed to explain legal text', { error, provider, locale });
    throw error;
  }
}
