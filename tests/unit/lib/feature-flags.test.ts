import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('feature-flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults all flags to false when env vars are not set', async () => {
    delete process.env.NEXT_PUBLIC_FEATURE_ESIG;
    delete process.env.NEXT_PUBLIC_FEATURE_PAYMENTS;
    delete process.env.NEXT_PUBLIC_FEATURE_AI_IMPORT;
    delete process.env.NEXT_PUBLIC_FEATURE_EMAILS;

    const flags = await import('@/lib/feature-flags');
    expect(flags.FEATURE_ESIG).toBe(false);
    expect(flags.FEATURE_PAYMENTS).toBe(false);
    expect(flags.FEATURE_AI_IMPORT).toBe(false);
    expect(flags.FEATURE_EMAILS).toBe(false);
  });

  it('returns true when env vars are set to "true"', async () => {
    process.env.NEXT_PUBLIC_FEATURE_ESIG = 'true';
    process.env.NEXT_PUBLIC_FEATURE_PAYMENTS = 'true';
    process.env.NEXT_PUBLIC_FEATURE_AI_IMPORT = 'true';
    process.env.NEXT_PUBLIC_FEATURE_EMAILS = 'true';

    const flags = await import('@/lib/feature-flags');
    expect(flags.FEATURE_ESIG).toBe(true);
    expect(flags.FEATURE_PAYMENTS).toBe(true);
    expect(flags.FEATURE_AI_IMPORT).toBe(true);
    expect(flags.FEATURE_EMAILS).toBe(true);
  });

  it('returns false for non-"true" values like "false" or "1"', async () => {
    process.env.NEXT_PUBLIC_FEATURE_ESIG = 'false';
    process.env.NEXT_PUBLIC_FEATURE_PAYMENTS = '1';
    process.env.NEXT_PUBLIC_FEATURE_AI_IMPORT = 'yes';
    process.env.NEXT_PUBLIC_FEATURE_EMAILS = 'false';

    const flags = await import('@/lib/feature-flags');
    expect(flags.FEATURE_ESIG).toBe(false);
    expect(flags.FEATURE_PAYMENTS).toBe(false);
    expect(flags.FEATURE_AI_IMPORT).toBe(false);
    expect(flags.FEATURE_EMAILS).toBe(false);
  });
});
