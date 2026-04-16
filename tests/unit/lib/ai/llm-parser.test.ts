import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDocumentWithLlm,
  translateTemplateToLanguage,
  clearParseCache,
} from '@/lib/ai/llm-parser';

const mockCreate = vi.fn();
// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: mockCreate,
      };
    },
  };
});

// Mock settings module (imports Prisma which isn't available in unit tests)
vi.mock('@/lib/settings/llm-settings', () => ({
  getLlmSetting: vi.fn().mockResolvedValue(null),
}));

// ── Test data ───────────────────────────────────────────────────

/** Phase 1 output: monolingual template (plain strings, no LocalizedString) */
const MONO_TEMPLATE = {
  version: 1,
  steps: [
    {
      key: 'step_1',
      title: 'שלב א',
      fields: [
        {
          key: 'field_1',
          type: 'text',
          label: 'שדה',
          required: true,
          width: 'full',
        },
      ],
    },
  ],
  documentBody: 'גוף המסמך עם {{field_1}}',
};

/** Single-language translation output (e.g. English) */
const EN_TEMPLATE = {
  version: 1,
  steps: [
    {
      key: 'step_1',
      title: 'Step 1',
      fields: [
        {
          key: 'field_1',
          type: 'text',
          label: 'Field',
          required: true,
          width: 'full',
        },
      ],
    },
  ],
  documentBody: 'Document body with {{field_1}}',
};

/** Strip leading '{' to simulate Claude prefill continuation */
const asClaude = (json: string) => json.substring(json.indexOf('{') + 1);

const mockUsage = { input_tokens: 100, output_tokens: 200 };

describe('llm-parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearParseCache();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('successfully parses monolingual template (parse-only)', async () => {
    const monoJson = JSON.stringify(MONO_TEMPLATE);

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(monoJson) }],
      usage: mockUsage,
    });

    const result = await parseDocumentWithLlm('test text', 'claude', 'fake-key');
    expect(result.definition).toEqual(MONO_TEMPLATE);
    expect(result.errors).toHaveLength(0);
    expect(result.confidence).toBe(85);
    expect(result.tokenUsage?.parse).toBeDefined();
    expect(result.tokenUsage?.translate).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('handles invalid JSON from LLM in parse phase', async () => {
    // All retry attempts return non-JSON → parse phase fails
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Not JSON' }],
      usage: mockUsage,
    });

    const result = await parseDocumentWithLlm('test text', 'claude', 'fake-key');
    expect(result.definition).toBeNull();
    expect(result.errors[0]).toContain('Invalid JSON in parse phase');
    expect(result.errorKind).toBe('json_parse');
  }, 15_000);

  it('reports token usage from parse phase', async () => {
    const monoJson = JSON.stringify(MONO_TEMPLATE);
    const parseUsage = { input_tokens: 150, output_tokens: 300 };

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(monoJson) }],
      usage: parseUsage,
    });

    const result = await parseDocumentWithLlm('test text', 'claude', 'fake-key');
    expect(result.tokenUsage?.parse).toEqual({ inputTokens: 150, outputTokens: 300 });
  });

  it('translates template to a single language', async () => {
    const enJson = JSON.stringify(EN_TEMPLATE);

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(enJson) }],
      usage: mockUsage,
    });

    const result = await translateTemplateToLanguage(MONO_TEMPLATE, 'en', 'claude', 'fake-key');
    expect(result.definition).toEqual(EN_TEMPLATE);
    expect(result.confidence).toBe(90);
    expect(result.errors).toHaveLength(0);
    expect(result.tokenUsage?.translate).toBeDefined();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('handles translation failure gracefully', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Translation error' }],
      usage: mockUsage,
    });

    const result = await translateTemplateToLanguage(MONO_TEMPLATE, 'en', 'claude', 'fake-key');
    expect(result.definition).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.errors[0]).toContain('Invalid JSON');
  }, 15_000);
});
