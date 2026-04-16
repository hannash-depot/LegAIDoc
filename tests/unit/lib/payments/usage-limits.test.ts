import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findFirst: vi.fn(),
    },
    document: {
      count: vi.fn(),
    },
  },
}));

import { getUserUsage } from '@/lib/payments/usage-limits';
import { db } from '@/lib/db';

const mockSubFindFirst = vi.mocked(db.subscription.findFirst);
const mockDocCount = vi.mocked(db.document.count);

describe('getUserUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no subscription info for users without active sub', async () => {
    mockSubFindFirst.mockResolvedValue(null);

    const result = await getUserUsage('user-1');

    expect(result.hasActiveSubscription).toBe(false);
    expect(result.canCreateDocument).toBe(true);
    expect(result.planName).toBeNull();
  });

  it('returns unlimited for plans with documentLimit -1', async () => {
    mockSubFindFirst.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: { nameEn: 'Pro', documentLimit: -1 },
    } as never);

    const result = await getUserUsage('user-1');

    expect(result.hasActiveSubscription).toBe(true);
    expect(result.documentLimit).toBe(-1);
    expect(result.canCreateDocument).toBe(true);
  });

  it('allows creation when under limit', async () => {
    mockSubFindFirst.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      startDate: new Date('2025-01-01'),
      endDate: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: { nameEn: 'Basic', documentLimit: 10 },
    } as never);
    mockDocCount.mockResolvedValue(5);

    const result = await getUserUsage('user-1');

    expect(result.documentsUsed).toBe(5);
    expect(result.documentLimit).toBe(10);
    expect(result.canCreateDocument).toBe(true);
  });

  it('blocks creation when at limit', async () => {
    mockSubFindFirst.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      startDate: new Date('2025-01-01'),
      endDate: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: { nameEn: 'Starter', documentLimit: 5 },
    } as never);
    mockDocCount.mockResolvedValue(5);

    const result = await getUserUsage('user-1');

    expect(result.documentsUsed).toBe(5);
    expect(result.canCreateDocument).toBe(false);
  });
});
