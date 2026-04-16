import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { expireOverdueSubscriptions, renewSubscription } from '@/lib/payments/subscription-service';
import { db } from '@/lib/db';

const mockUpdateMany = vi.mocked(db.subscription.updateMany);
const mockFindUnique = vi.mocked(db.subscription.findUnique);
const mockUpdate = vi.mocked(db.subscription.update);

describe('subscription-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('expireOverdueSubscriptions', () => {
    it('marks overdue ACTIVE subscriptions as EXPIRED', async () => {
      mockUpdateMany.mockResolvedValue({ count: 3 });

      const count = await expireOverdueSubscriptions();

      expect(count).toBe(3);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endDate: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      });
    });

    it('returns 0 when no subscriptions are overdue', async () => {
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const count = await expireOverdueSubscriptions();

      expect(count).toBe(0);
    });
  });

  describe('renewSubscription', () => {
    it('extends end date by 1 year from current end', async () => {
      const endDate = new Date('2026-06-15T00:00:00Z');
      mockFindUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'ACTIVE',
        startDate: new Date('2025-06-15'),
        endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUpdate.mockResolvedValue({} as never);

      const result = await renewSubscription('sub-1');

      expect(result.newEndDate.getFullYear()).toBe(2027);
      expect(result.newEndDate.getMonth()).toBe(endDate.getMonth());
    });

    it('throws if subscription not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(renewSubscription('nonexistent')).rejects.toThrow(
        'Subscription nonexistent not found',
      );
    });

    it('renews from now if subscription is expired', async () => {
      const pastDate = new Date('2024-01-01T00:00:00Z');
      mockFindUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'EXPIRED',
        startDate: new Date('2023-01-01'),
        endDate: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUpdate.mockResolvedValue({} as never);

      const result = await renewSubscription('sub-1');

      // Should extend from now, not from the past end date
      const now = new Date();
      expect(result.newEndDate.getFullYear()).toBe(now.getFullYear() + 1);
    });
  });
});
