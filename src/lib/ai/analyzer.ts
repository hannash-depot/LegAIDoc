import { getLlmSetting } from '@/lib/settings/llm-settings';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type LlmProvider = 'openai' | 'claude' | 'gemini';

export interface RiskAnalysisResult {
  executiveSummary: string;
  risks: {
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    recommendation: string;
  }[];
  missingClauses: {
    clause: string;
    reason: string;
  }[];
}

const LLM_TIMEOUT_MS = 60_000;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ANALYZER_PROMPT = `You are an expert legal document analyst. Your job is to review a 3rd-party contract and extract its key points and risks.

You MUST output valid JSON that follows this exact schema:

{
  "executiveSummary": "A concise summary of the agreement's purpose and key terms in the document's original language.",
  "risks": [
    {
      "severity": "low | medium | high",
      "title": "Short title of the risk",
      "description": "Detailed description of why this is a risk",
      "recommendation": "What the user should do to mitigate this risk"
    }
  ],
  "missingClauses": [
    {
      "clause": "Name of standard clause missing",
      "reason": "Why it should be included"
    }
  ]
}

Rules:
1. Provide the response in the SAME LANGUAGE as the original document.
2. Output ONLY the JSON object — no markdown, no code fences, no explanation.
3. IMPORTANT: Do NOT include unescaped newlines inside JSON string values. Use \\n instead.
4. Focus on risks that typically harm the receiving party (e.g., unlimited liability, unfavorable termination, missing IP assignment).
5. You are providing an automated analysis tool, NOT legal advice. Your output will be prefaced with a disclaimer. Do not make definitive legal conclusions — use hedging language such as "may," "could," and "consider consulting a qualified attorney."
`;

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
      `API key not provided for ${provider}. set ${ENV_KEY_MAP[provider]} or configure UI.`,
    );
  }
  return key.replace(/[\u2022\u200B-\u200D\uFEFF]/g, '').trim();
}

/** Sanitize helper to avoid JSON parse errors */
function extractJson(raw: string): RiskAnalysisResult {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  const startIdx = text.indexOf('{');
  if (startIdx === -1) throw new Error('No JSON found in response');
  const draft = text.substring(startIdx);
  return JSON.parse(draft) as RiskAnalysisResult;
}

// ─── Provider implementations ───────────────────────────────────────

async function callOpenAI(userContent: string, apiKey: string): Promise<RiskAnalysisResult> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create(
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ANALYZER_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return extractJson(content);
}

async function callClaude(userContent: string, apiKey: string): Promise<RiskAnalysisResult> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create(
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      system: ANALYZER_PROMPT,
      messages: [
        { role: 'user', content: userContent },
        { role: 'assistant', content: '{' },
      ],
    },
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  );

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Empty response from Claude');
  return extractJson('{' + block.text);
}

async function callGemini(userContent: string, apiKey: string): Promise<RiskAnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: ANALYZER_PROMPT,
    generationConfig: {
      temperature: 0.1,
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
  return extractJson(content);
}

// ─── Main Orchestrator ──────────────────────────────────────────────

export async function analyzeContract(
  text: string,
  provider: LlmProvider = 'claude',
): Promise<RiskAnalysisResult> {
  const key = await resolveApiKey(provider);
  const maxChars = 30000;
  const truncatedText =
    text.length > maxChars ? text.substring(0, maxChars) + '\n [DOCUMENT TRUNCATED]' : text;
  const userContent = `Analyze the following document text:\n\n${truncatedText}`;

  try {
    if (provider === 'openai') return await callOpenAI(userContent, key);
    if (provider === 'claude') return await callClaude(userContent, key);
    if (provider === 'gemini') return await callGemini(userContent, key);
    throw new Error('Unsupported provider');
  } catch (err: unknown) {
    logger.error('Failed to parse AI contract analysis', err, { provider });
    throw err;
  }
}
