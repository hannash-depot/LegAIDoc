import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDocumentWithLlm, clearParseCache } from '@/lib/ai/llm-parser';

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

/** Phase 1 output: monolingual template (plain strings) */
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

const mockUsage = { input_tokens: 100, output_tokens: 200 };

/** Strip leading '{' to simulate Claude prefill continuation */
const asClaude = (text: string) => {
  const idx = text.indexOf('{');
  return idx !== -1 ? text.substring(idx + 1) : text;
};

describe('llm-parser robustness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearParseCache();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('handles JSON with preamble and postamble text', async () => {
    const raw = `Here is the result: ${JSON.stringify(MONO_TEMPLATE)} Hope it helps!`;
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(raw) }],
      usage: mockUsage,
    });
    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toEqual(MONO_TEMPLATE);
    expect(result.errors).toHaveLength(0);
  });

  it('handles JSON with postamble containing braces', async () => {
    const raw = `${JSON.stringify(MONO_TEMPLATE)} Extra text with brace }`;
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(raw) }],
      usage: mockUsage,
    });
    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toEqual(MONO_TEMPLATE);
    expect(result.errors).toHaveLength(0);
  });

  it('handles markdown wrapped JSON', async () => {
    const raw = '```json\n' + JSON.stringify(MONO_TEMPLATE) + '\n```';
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(raw) }],
      usage: mockUsage,
    });
    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toEqual(MONO_TEMPLATE);
    expect(result.errors).toHaveLength(0);
  });

  it('handles unescaped newlines in JSON strings (sanitation)', async () => {
    const buggyJson = `
            "version": 1,
            "steps": [
                {
                    "key": "step_1",
                    "title": "שלב א",
                    "fields": [
                        {
                            "key": "field_1",
                            "type": "text",
                            "label": "שדה",
                            "required": true,
                            "width": "full"
                        }
                    ]
                }
            ],
            "documentBody": "Line 1
Line 2"
        }`;
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: buggyJson }],
      usage: mockUsage,
    });
    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('fails gracefully on non-JSON content', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is definitely not JSON' }],
      usage: mockUsage,
    });
    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toBeNull();
    expect(result.errors[0]).toContain('Invalid JSON');
    expect(result.errorKind).toBe('json_parse');
  }, 15_000);

  it('retries parse phase on first failure then succeeds', async () => {
    const monoJson = JSON.stringify(MONO_TEMPLATE);

    // Attempt 1: fails with non-JSON
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Oops, error occurred' }],
      usage: mockUsage,
    });
    // Attempt 2: succeeds
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: asClaude(monoJson) }],
      usage: mockUsage,
    });

    const result = await parseDocumentWithLlm('test', 'claude', 'key');
    expect(result.definition).toEqual(MONO_TEMPLATE);
    expect(result.errors).toHaveLength(0);
    expect(mockCreate).toHaveBeenCalledTimes(2); // 2 parse attempts
  }, 15_000);
});
