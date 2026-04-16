/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

let testUser: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

vi.mock('@/lib/ai/explainer', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/explainer')>('@/lib/ai/explainer');
  return {
    ...actual,
    explainLegalText: vi.fn(
      async (text: string, locale: string) => `Explained(${locale}): ${text}`,
    ),
  };
});

const { auth } = await import('../../../../src/auth');
const { explainLegalText } = await import('../../../../src/lib/ai/explainer');
const { POST } = await import('../../../../src/app/api/documents/explain/route');

const ENV_KEYS = ['GOOGLE_AI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

describe('Explain Document API (/api/documents/explain)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();

    for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  });

  afterAll(async () => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    await clearDbData();
  });

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(explainLegalText).mockClear();
    for (const k of ENV_KEYS) delete process.env[k];
    process.env.GOOGLE_AI_API_KEY = 'test-gemini-key';
  });

  const createRequest = (body: any) =>
    new NextRequest('http://localhost:3000/api/documents/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  test('returns explanation envelope for authenticated non-admin user', async () => {
    const res = await POST(createRequest({ text: 'The party shall indemnify.', locale: 'he' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.explanation).toBe('Explained(he): The party shall indemnify.');
    expect(explainLegalText).toHaveBeenCalledWith('The party shall indemnify.', 'he', 'gemini');
  });

  test('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const res = await POST(createRequest({ text: 'hello', locale: 'en' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  test('returns 400 when text is missing', async () => {
    const res = await POST(createRequest({ locale: 'en' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  test('returns 503 when no provider is configured', async () => {
    for (const k of ENV_KEYS) delete process.env[k];
    const res = await POST(createRequest({ text: 'hello', locale: 'en' }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(explainLegalText).not.toHaveBeenCalled();
  });

  test('falls back to openai when only OPENAI_API_KEY is set', async () => {
    for (const k of ENV_KEYS) delete process.env[k];
    process.env.OPENAI_API_KEY = 'test-openai-key';
    const res = await POST(createRequest({ text: 'clause', locale: 'en' }));
    expect(res.status).toBe(200);
    expect(explainLegalText).toHaveBeenCalledWith('clause', 'en', 'openai');
  });

  test('defaults locale to en when omitted', async () => {
    const res = await POST(createRequest({ text: 'clause' }));
    expect(res.status).toBe(200);
    expect(explainLegalText).toHaveBeenCalledWith('clause', 'en', 'gemini');
  });
});
