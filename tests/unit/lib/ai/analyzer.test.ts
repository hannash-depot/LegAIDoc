import { describe, it, expect, vi } from 'vitest';
import { analyzeContract } from '@/lib/ai/analyzer';

// Mock getLlmSetting
vi.mock('@/lib/settings/llm-settings', () => ({
  getLlmSetting: vi.fn().mockResolvedValue({ isActive: true, apiKey: 'fake-key' }),
}));

// Mock GoogleGenerativeAI
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor() {}
      getGenerativeModel() {
        return { generateContent: mockGenerateContent };
      }
    },
  };
});

describe('analyzeContract', () => {
  it('should successfully parse a valid JSON response from Gemini', async () => {
    const mockResponse = {
      response: {
        text: () => `
\`\`\`json
{
  "executiveSummary": "This is a summary of the agreement.",
  "risks": [
    {
      "severity": "high",
      "title": "Unlimited Liability",
      "description": "Provider bears unlimited liability",
      "recommendation": "Cap liability at fees paid"
    }
  ],
  "missingClauses": [
    {
      "clause": "Force Majeure",
      "reason": "Protects against unforeseen events"
    }
  ]
}
\`\`\`
`,
      },
    };

    mockGenerateContent.mockResolvedValueOnce(mockResponse);

    const result = await analyzeContract('Some contract text here...', 'gemini');

    expect(result).toHaveProperty('executiveSummary', 'This is a summary of the agreement.');
    expect(result.risks).toHaveLength(1);
    expect(result.risks[0].severity).toBe('high');
    expect(result.missingClauses).toHaveLength(1);
  });

  it('should throw an error if JSON is invalid', async () => {
    const mockResponse = {
      response: {
        text: () => 'Not a JSON response',
      },
    };

    mockGenerateContent.mockResolvedValueOnce(mockResponse);

    await expect(analyzeContract('text', 'gemini')).rejects.toThrow('No JSON found in response');
  });
});
