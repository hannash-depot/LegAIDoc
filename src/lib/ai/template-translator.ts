import { type LlmProvider, type TokenUsage } from './llm-parser';
import { getLlmSetting } from '@/lib/settings/llm-settings';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Types ───────────────────────────────────────────────────────

export interface BatchTranslateResult {
  translatedMap: Record<string, string>;
  tokenUsage: TokenUsage;
}

// ─── Prompt ──────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  he: 'Hebrew',
  ar: 'Arabic',
  en: 'English',
  ru: 'Russian',
};

function buildPrompt(targetLang: string): string {
  const langName = LANG_NAMES[targetLang] || targetLang;
  return `You are a translation assistant for LegAIDoc, an Israeli legal document platform.

You will receive a JSON object mapping numbered keys to Hebrew text strings. These strings come from legal document templates — they include field labels, step titles, document body text, and descriptions.

Your job is to translate ALL values from Hebrew to ${langName}.

Rules:
1. Translate EVERY value. Do not skip any key.
2. Preserve ALL {{placeholder_key}} tokens in the text EXACTLY as they appear.
3. Preserve any HTML tags exactly as they appear.
4. Use appropriate legal terminology for ${langName}.
5. Output ONLY a valid JSON object with the same keys and translated values.
6. Do NOT add any explanation, markdown, or code fences — just the JSON.
7. IMPORTANT: Do NOT include unescaped newlines inside JSON string values. Use \\n instead.`;
}

// ─── Provider implementations ────────────────────────────────────

const LLM_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LlmResponse {
  content: string;
  usage: TokenUsage;
}

const ENV_KEY_MAP: Record<LlmProvider, string> = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
};

async function resolveApiKey(provider: LlmProvider, apiKey?: string): Promise<string> {
  let key = apiKey;
  if (!key) {
    const dbSetting = await getLlmSetting(provider);
    if (dbSetting?.isActive && dbSetting.apiKey) key = dbSetting.apiKey;
  }
  if (!key) key = process.env[ENV_KEY_MAP[provider]];
  if (!key) throw new Error(`API key not found for ${provider}`);
  return key.replace(/[\u2022\u200B-\u200D\uFEFF]/g, '').trim();
}

async function callOpenAI(system: string, user: string, apiKey: string): Promise<LlmResponse> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create(
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 16384,
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return {
    content,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
  };
}

async function callClaude(system: string, user: string, apiKey: string): Promise<LlmResponse> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      temperature: 0.1,
      system,
      messages: [
        { role: 'user', content: user },
        { role: 'assistant', content: '{' },
      ],
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );
  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Empty response from Claude');
  return {
    content: '{' + block.text,
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}

async function callGemini(system: string, user: string, apiKey: string): Promise<LlmResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: system,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
    },
  });
  const result = await Promise.race([
    model.generateContent(user),
    delay(LLM_TIMEOUT_MS).then(() => {
      throw new Error('Gemini request timed out');
    }),
  ]);
  const content = result.response.text();
  if (!content) throw new Error('Empty response from Gemini');
  const meta = result.response.usageMetadata;
  return {
    content,
    usage: {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
    },
  };
}

type ProviderCallFn = (system: string, user: string, apiKey: string) => Promise<LlmResponse>;

const PROVIDER_FN: Record<LlmProvider, ProviderCallFn> = {
  openai: callOpenAI,
  claude: callClaude,
  gemini: callGemini,
};

// ─── JSON extraction ─────────────────────────────────────────────

function sanitizeJsonNewlines(input: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (inString) {
      if (ch === '\\' && i + 1 < input.length) {
        result.push(ch, input[i + 1]);
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        result.push(ch);
      } else if (ch === '\n') {
        result.push('\\', 'n');
      } else if (ch === '\r') {
        /* skip */
      } else {
        result.push(ch);
      }
    } else {
      if (ch === '"') inString = true;
      result.push(ch);
    }
    i++;
  }
  return result.join('');
}

function extractJson(raw: string): Record<string, string> | null {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;
  text = text.substring(startIdx);

  // Try parsing directly, then with sanitization
  for (const candidate of [text, sanitizeJsonNewlines(text)]) {
    let endIdx = candidate.lastIndexOf('}');
    while (endIdx !== -1) {
      try {
        const parsed = JSON.parse(candidate.substring(0, endIdx + 1));
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {
        /* continue */
      }
      endIdx = candidate.lastIndexOf('}', endIdx - 1);
    }
  }
  return null;
}

// ─── Main export ─────────────────────────────────────────────────

/**
 * Translate a numbered string map from Hebrew to a target language using LLM.
 */
export async function translateStringMap(
  stringMap: Record<string, string>,
  targetLang: string,
  provider: LlmProvider = 'claude',
  apiKey?: string,
): Promise<BatchTranslateResult> {
  const key = await resolveApiKey(provider, apiKey);
  const callFn = PROVIDER_FN[provider];
  const systemPrompt = buildPrompt(targetLang);
  const userContent = `Translate these strings from Hebrew to ${LANG_NAMES[targetLang] || targetLang}:\n\n${JSON.stringify(stringMap, null, 2)}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await delay(1000 * Math.pow(2, attempt - 1));

    try {
      const response = await callFn(systemPrompt, userContent, key);
      const parsed = extractJson(response.content);

      if (!parsed) {
        if (attempt < MAX_ATTEMPTS) {
          logger.warn('Batch translate JSON extraction failed, retrying', { targetLang, attempt });
          continue;
        }
        throw new Error(`Failed to parse translation response for ${targetLang}`);
      }

      return { translatedMap: parsed, tokenUsage: response.usage };
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS) throw err;
      logger.warn('Batch translate attempt failed, retrying', {
        targetLang,
        attempt,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  throw new Error(`All translation attempts exhausted for ${targetLang}`);
}
