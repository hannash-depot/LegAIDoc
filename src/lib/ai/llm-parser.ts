import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MonolingualTemplate } from '@/schemas/template-definition';
import { getLlmSetting } from '@/lib/settings/llm-settings';
import { logger } from '@/lib/logger';
import { getCached, setCached, hashContent, clearParseCache } from '@/lib/ai/parse-cache';

// Re-export so existing tests importing from llm-parser keep working.
export { clearParseCache };

// ─── Helpers ──────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** LLM request timeout (60 seconds). */
const LLM_TIMEOUT_MS = 60_000;

/**
 * Progress event emitted during streaming parse.
 *  - status:  coarse stage change ("calling_llm", "extracting_json", "cache_hit")
 *  - delta:   incremental LLM output token(s); useful for progress UI
 */
export type ParseProgressEvent =
  | { type: 'status'; stage: string }
  | { type: 'delta'; text: string };

export type ParseProgressHandler = (ev: ParseProgressEvent) => void;

/**
 * AISP-03/04/05: Multi-provider LLM-powered template parsing.
 * Phase 1 (Parse): Extract structure in original language only.
 * Translation is done separately per language via translateTemplateToLanguage().
 */

export type LlmProvider = 'openai' | 'claude' | 'gemini';

export type ParseErrorKind = 'json_parse' | 'schema_validation' | 'api_error' | 'empty_response';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ParseResult {
  definition: unknown;
  confidence: number;
  errors: string[];
  errorKind?: ParseErrorKind;
  rawResponse?: string;
  tokenUsage?: {
    parse?: TokenUsage;
    translate?: TokenUsage;
  };
}

interface LlmResponse {
  content: string;
  usage: TokenUsage;
}

// ─── Prompts ──────────────────────────────────────────────────────

const PARSE_PROMPT = `You are a legal document parser for LegAIDoc, an Israeli legal document platform.
Your job is to analyze raw legal document text and convert it into a structured template definition.

You MUST output valid JSON that follows this exact schema:

{
  "version": 1,
  "steps": [
    {
      "key": "string (e.g. step_parties)",
      "title": "string — step title in the document's language",
      "fields": [
        {
          "key": "string (e.g. tenant_name)",
          "type": "text|textarea|number|currency|date|email|phone|id-number|select|radio|multi-select|checkbox",
          "required": true/false,
          "width": "full|half",
          "label": "string — field label in the document's language",
          "placeholder": "string — placeholder hint in the document's language"
        }
      ]
    }
  ],
  "documentBody": "The full document text with {{placeholder_key}} tokens replacing all variables"
}

Rules:
1. Identify ALL variable entities (names, amounts, dates, IDs) and replace with {{placeholder_key}} syntax.
2. Each placeholder MUST have a corresponding field definition.
3. Infer the correct field type from context (dates → date, monetary amounts → currency, etc.).
4. Group related fields into logical steps (e.g., "Party Details", "Property Details", "Financial Terms").
5. Keep ALL text in the document's original language — do NOT translate anything.
6. The documentBody template should use {{placeholder_key}} tokens matching the field keys.
7. Preserve the legal structure and section headings of the original document.
8. Output ONLY the JSON object — no markdown, no code fences, no explanation.
9. IMPORTANT: Do NOT include unescaped newlines inside JSON string values. Use \\n instead.`;

const PARSE_FEW_SHOT = `Example input: "הסכם שכירות בין [שם המשכיר] לבין [שם השוכר] לשכירת הנכס ברח' [כתובת] תמורת [סכום] ש"ח לחודש"

Example output:
{
  "version": 1,
  "steps": [
    {
      "key": "step_parties",
      "title": "פרטי הצדדים",
      "fields": [
        {
          "key": "landlord_name",
          "type": "text",
          "required": true,
          "width": "half",
          "label": "שם המשכיר",
          "placeholder": "שם מלא"
        },
        {
          "key": "tenant_name",
          "type": "text",
          "required": true,
          "width": "half",
          "label": "שם השוכר",
          "placeholder": "שם מלא"
        }
      ]
    }
  ],
  "documentBody": "הסכם שכירות בין {{landlord_name}} לבין {{tenant_name}} לשכירת הנכס ב{{property_address}} תמורת {{monthly_rent}} ש\\"ח לחודש"
}`;

const TRANSLATE_SINGLE_LANG_PROMPT = `You are a translation assistant for LegAIDoc, an Israeli legal document platform.

You will receive a monolingual template JSON with steps, fields, and a documentBody in one language. Your job is to translate all user-facing string values into the specified target language.

Translate these fields:
1. Each step "title" string
2. Each field "label" string
3. Each field "placeholder" string (if present)
4. The "documentBody" string

Rules:
1. Preserve ALL keys, types, required, width values exactly as they are.
2. Preserve ALL {{placeholder_key}} tokens in documentBody exactly as they are.
3. Output the same JSON structure with translated strings.
4. Output ONLY the JSON object — no markdown, no code fences, no explanation.
5. IMPORTANT: Do NOT include unescaped newlines inside JSON string values. Use \\n instead.`;

/** Provider-specific env var keys for fallback when no UI key is provided */
const ENV_KEY_MAP: Record<LlmProvider, string> = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
};

// ─── JSON extraction helpers ──────────────────────────────────────

/**
 * Fix unescaped newlines inside JSON string values using a character-level
 * state machine. Unlike a regex, this correctly handles escaped quotes (\")
 * which are common in Hebrew legal text (e.g., ש\"ח).
 */
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
        // Skip carriage returns inside strings
      } else {
        result.push(ch);
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      result.push(ch);
    }

    i++;
  }

  return result.join('');
}

function tryIterativeParse(text: string): { parsed: unknown; cleaned: string } | null {
  let endIdx = text.lastIndexOf('}');
  while (endIdx !== -1) {
    const candidate = text.substring(0, endIdx + 1);
    try {
      const parsed = JSON.parse(candidate);
      return { parsed, cleaned: candidate };
    } catch {
      endIdx = text.lastIndexOf('}', endIdx - 1);
    }
  }
  return null;
}

function extractJson(raw: string): { parsed: unknown; cleaned: string } | null {
  let text = raw.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;

  const draft = text.substring(startIdx);

  const result = tryIterativeParse(draft);
  if (result) return result;

  const sanitized = sanitizeJsonNewlines(draft);
  return tryIterativeParse(sanitized);
}

// ─── Provider implementations ───────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
): Promise<LlmResponse> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create(
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
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

async function callClaude(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  onDelta?: (text: string) => void,
): Promise<LlmResponse> {
  const client = new Anthropic({ apiKey });
  const params = {
    model: 'claude-sonnet-4-6',
    max_tokens: 16384,
    temperature: 0.1,
    system: systemPrompt,
    messages: [
      { role: 'user' as const, content: userContent },
      { role: 'assistant' as const, content: '{' },
    ],
  };
  const opts = { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) };

  if (onDelta) {
    // Streaming path: emits text deltas to the caller as tokens arrive.
    const stream = client.messages.stream(params, opts);
    stream.on('text', (text: string) => {
      try {
        onDelta(text);
      } catch {
        // Never let a UI handler break the stream.
      }
    });
    const finalMsg = await stream.finalMessage();
    const block = finalMsg.content[0];
    if (!block || block.type !== 'text') throw new Error('Empty response from Claude');
    return {
      content: '{' + block.text,
      usage: {
        inputTokens: finalMsg.usage?.input_tokens ?? 0,
        outputTokens: finalMsg.usage?.output_tokens ?? 0,
      },
    };
  }

  const response = await client.messages.create(params, opts);
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

async function callGemini(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
): Promise<LlmResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
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

  const meta = result.response.usageMetadata;
  return {
    content,
    usage: {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
    },
  };
}

type ProviderCallFn = (
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  onDelta?: (text: string) => void,
) => Promise<LlmResponse>;

const PROVIDER_FN: Record<LlmProvider, ProviderCallFn> = {
  openai: callOpenAI,
  claude: callClaude,
  gemini: callGemini,
};

// ─── Key resolution ─────────────────────────────────────────────

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

  // Clean copy-paste artifacts
  return key.replace(/[\u2022\u200B-\u200D\uFEFF]/g, '').trim();
}

// ─── Phase 2: Parse structure ───────────────────────────────────

const MAX_ATTEMPTS = 3;

async function parseStructure(
  text: string,
  provider: LlmProvider,
  key: string,
  onProgress?: ParseProgressHandler,
): Promise<{ definition: unknown; usage: TokenUsage; rawResponse?: string }> {
  // Check cache first
  const cacheKey = hashContent(text, provider);
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info('Parse cache hit', { provider });
    onProgress?.({ type: 'status', stage: 'cache_hit' });
    return cached;
  }

  const callFn = PROVIDER_FN[provider];
  const userContent = `Here is a few-shot example:\n\n${PARSE_FEW_SHOT}\n\nNow parse this legal document into a template definition. Output ONLY valid JSON:\n\n${text}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await delay(500 * Math.pow(2, attempt - 1)); // 1s, 2s
    }

    onProgress?.({
      type: 'status',
      stage: attempt === 1 ? 'calling_llm' : `calling_llm_retry_${attempt}`,
    });
    const onDelta = onProgress
      ? (delta: string) => onProgress({ type: 'delta', text: delta })
      : undefined;
    const response = await callFn(PARSE_PROMPT, userContent, key, onDelta);
    onProgress?.({ type: 'status', stage: 'extracting_json' });
    const extractResult = extractJson(response.content);

    if (!extractResult) {
      if (attempt < MAX_ATTEMPTS) {
        logger.warn('Parse phase JSON extraction failed, retrying', {
          attempt,
          maxAttempts: MAX_ATTEMPTS,
        });
        continue;
      }
      logger.error('Parse phase JSON extraction failed after all attempts', undefined, {
        rawSnippet: response.content.substring(0, 500),
      });
      throw Object.assign(new Error('Invalid JSON in parse phase response'), {
        rawResponse: response.content.substring(0, 2000),
        usage: response.usage,
      });
    }

    const result = { definition: extractResult.parsed, usage: response.usage };
    setCached(cacheKey, result);
    return result;
  }

  // Should not reach here
  throw new Error('All parse attempts exhausted');
}

// ─── Single-language translate ──────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  he: 'Hebrew',
  ar: 'Arabic',
  en: 'English',
  ru: 'Russian',
};

async function translateToLanguage(
  monoTemplate: unknown,
  targetLang: string,
  provider: LlmProvider,
  key: string,
): Promise<{ definition: unknown; usage: TokenUsage; rawResponse?: string }> {
  const callFn = PROVIDER_FN[provider];
  const templateJson = JSON.stringify(monoTemplate, null, 2);
  const langName = LANG_NAMES[targetLang] || targetLang;
  const userContent = `Translate all user-facing string values in this template into ${langName} (${targetLang}):\n\n${templateJson}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await delay(1000 * Math.pow(2, attempt - 1));
    }

    const response = await callFn(TRANSLATE_SINGLE_LANG_PROMPT, userContent, key);
    const extractResult = extractJson(response.content);

    if (!extractResult) {
      if (attempt < MAX_ATTEMPTS) {
        logger.warn('Translate JSON extraction failed, retrying', {
          targetLang,
          attempt,
          maxAttempts: MAX_ATTEMPTS,
        });
        continue;
      }
      logger.error('Translate JSON extraction failed after all attempts', undefined, {
        targetLang,
        rawSnippet: response.content.substring(0, 500),
      });
      throw Object.assign(new Error(`Invalid JSON in translate response for ${langName}`), {
        rawResponse: response.content.substring(0, 2000),
        usage: response.usage,
      });
    }

    return { definition: extractResult.parsed, usage: response.usage };
  }

  throw new Error(`All translate attempts exhausted for ${langName}`);
}

// ─── Main orchestrator (parse only) ─────────────────────────────

/**
 * Parse document text into a monolingual template definition.
 * Translation is done separately per language via translateTemplateToLanguage().
 */
export async function parseDocumentWithLlm(
  text: string,
  provider: LlmProvider = 'claude',
  apiKey?: string,
  onProgress?: ParseProgressHandler,
): Promise<ParseResult> {
  const key = await resolveApiKey(provider, apiKey);
  const tokenUsage: { parse?: TokenUsage; translate?: TokenUsage } = {};

  try {
    let parseResult;
    try {
      parseResult = await parseStructure(text, provider, key, onProgress);
      tokenUsage.parse = parseResult.usage;
    } catch (err: unknown) {
      const errObj = err as { rawResponse?: string; usage?: TokenUsage; message?: string };
      if (errObj.usage) tokenUsage.parse = errObj.usage;
      return {
        definition: null,
        confidence: 0,
        errors: [errObj.message || 'Parse phase failed'],
        errorKind: 'json_parse',
        rawResponse: errObj.rawResponse,
        tokenUsage,
      };
    }

    // Validate output against monolingual schema
    const monoValidation = MonolingualTemplate.safeParse(parseResult.definition);
    if (monoValidation.success) {
      return { definition: monoValidation.data, confidence: 85, errors: [], tokenUsage };
    }

    // Return parsed data even if schema validation isn't perfect
    const errors = monoValidation.error.issues.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i: any) => `parse: ${i.path.join('.')}: ${i.message}`,
    );
    logger.warn('Monolingual schema validation issues', { errors });

    return {
      definition: parseResult.definition,
      confidence: Math.max(40, 85 - errors.length * 10),
      errors,
      errorKind: 'schema_validation',
      tokenUsage,
    };
  } catch (err: unknown) {
    // API-level errors (auth, rate limit, network)
    const message = err instanceof Error ? err.message : 'Unknown LLM error';
    let errorMsg = message;
    if (
      provider === 'gemini' &&
      ((err as { status?: number }).status === 403 || message.includes('403'))
    ) {
      errorMsg = `Gemini API Forbidden (403): ${message}. Verify your API key and ensure the 'Generative Language API' is enabled in the Google Cloud Console.`;
    }
    return {
      definition: null,
      confidence: 0,
      errors: [errorMsg],
      errorKind: 'api_error',
      tokenUsage,
    };
  }
}

/**
 * Translate a monolingual template into a single target language.
 * Returns the same monolingual shape with translated strings.
 */
export async function translateTemplateToLanguage(
  monoTemplate: unknown,
  targetLang: string,
  provider: LlmProvider = 'claude',
  apiKey?: string,
): Promise<ParseResult> {
  const key = await resolveApiKey(provider, apiKey);
  const tokenUsage: { parse?: TokenUsage; translate?: TokenUsage } = {};

  try {
    const result = await translateToLanguage(monoTemplate, targetLang, provider, key);
    tokenUsage.translate = result.usage;

    return {
      definition: result.definition,
      confidence: 90,
      errors: [],
      tokenUsage,
    };
  } catch (err: unknown) {
    const errObj = err as { rawResponse?: string; usage?: TokenUsage; message?: string };
    if (errObj.usage) tokenUsage.translate = errObj.usage;
    const message = err instanceof Error ? err.message : 'Unknown LLM error';
    let errorMsg = message;
    if (
      provider === 'gemini' &&
      ((err as { status?: number }).status === 403 || message.includes('403'))
    ) {
      errorMsg = `Gemini API Forbidden (403): ${message}. Verify your API key and ensure the 'Generative Language API' is enabled in the Google Cloud Console.`;
    }
    return {
      definition: null,
      confidence: 0,
      errors: [errorMsg],
      errorKind: errObj.rawResponse ? 'json_parse' : 'api_error',
      rawResponse: errObj.rawResponse,
      tokenUsage,
    };
  }
}
