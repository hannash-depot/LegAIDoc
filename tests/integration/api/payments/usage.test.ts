import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { clearDbData, seedTestUser } from '../../../test-utils';

// ---------- mocks ----------

let mockSession: { user: { id: string; email: string } } | null = null;

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const mockUsageData = {
  hasActiveSubscription: true,
  planName: 'Test Plan',
  documentLimit: 50,
  documentsUsed: 3,
  canCreateDocument: true,
};

vi.mock('@/lib/payments/usage-limits', () => ({
  getUserUsage: vi.fn(() => Promise.resolve(mockUsageData)),
}));

// ---------- import handler after mocks ----------

let GET: () => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../../src/app/api/payments/usage/route');
  GET = mod.GET;
});

// ---------- tests ----------

describe('GET /api/payments/usage', () => {
  let user: Awaited<ReturnType<typeof seedTestUser>>;

  beforeAll(async () => {
    await clearDbData();
    user = await seedTestUser();
  });

  afterAll(async () => {
    await clearDbData();
  });

  beforeEach(() => {
    mockSession = { user: { id: user.id, email: user.email } };
  });

  it('returns usage stats for authenticated user', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockUsageData);
  });

  it('returns 401 when unauthenticated', async () => {
    mockSession = null;

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});
