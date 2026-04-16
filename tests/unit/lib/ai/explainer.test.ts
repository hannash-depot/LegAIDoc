import { describe, it, expect, vi, beforeEach } from 'vitest';
import { explainLegalText } from '@/lib/ai/explainer';

const mockGoogleGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: mockGoogleGenerateContent,
      };
    }
  },
}));

const mockAnthropicCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: mockAnthropicCreate,
      };
    },
  };
});

const mockOpenaiCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: mockOpenaiCreate,
        },
      };
    },
  };
});

vi.mock('@/lib/settings/llm-settings', () => ({
  getLlmSetting: vi.fn().mockResolvedValue({ isActive: true, apiKey: 'fake-db-key' }),
}));

describe('explainLegalText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses Gemini to explain text by default', async () => {
    mockGoogleGenerateContent.mockResolvedValue({
      response: {
        text: () => 'This is a mock Gemini explanation.',
        usageMetadata: {},
      },
    });

    const result = await explainLegalText('complex text', 'en', 'gemini', 'fake-key');
    expect(result).toBe('This is a mock Gemini explanation.');
    expect(mockGoogleGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('uses Claude to explain text when provider is claude', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is a mock Claude explanation.' }],
    });

    const result = await explainLegalText('complex text', 'he', 'claude', 'fake-key');
    expect(result).toBe('This is a mock Claude explanation.');
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('uses OpenAI to explain text when provider is openai', async () => {
    mockOpenaiCreate.mockResolvedValue({
      choices: [{ message: { content: 'This is a mock OpenAI explanation.' } }],
      usage: {},
    });

    const result = await explainLegalText('complex text', 'ar', 'openai', 'fake-key');
    expect(result).toBe('This is a mock OpenAI explanation.');
    expect(mockOpenaiCreate).toHaveBeenCalledTimes(1);
  });

  it('throws error when LLM response is empty', async () => {
    mockGoogleGenerateContent.mockResolvedValue({
      response: {
        text: () => '',
        usageMetadata: {},
      },
    });

    await expect(explainLegalText('complex text', 'en', 'gemini', 'fake-key')).rejects.toThrow(
      'Empty response',
    );
  });
});
