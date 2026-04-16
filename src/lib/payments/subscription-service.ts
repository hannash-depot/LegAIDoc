import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Mark expired subscriptions as EXPIRED.
 * Should be called periodically (e.g., via cron or on relevant API calls).
 */
export async function expireOverdueSubscriptions(): Promise<number> {
  const result = await db.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  if (result.count > 0) {
    logger.info(`Expired ${result.count} overdue subscription(s)`);
  }

  return result.count;
}

/**
 * Renew a subscription by extending its end date by 1 year.
 * Called after successful renewal payment.
 */
export async function renewSubscription(subscriptionId: string): Promise<{ newEndDate: Date }> {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} not found`);
  }

  // Extend from current end date (or now if expired)
  const baseDate =
    subscription.endDate && subscription.endDate > new Date() ? subscription.endDate : new Date();

  const newEndDate = new Date(baseDate);
  newEndDate.setFullYear(newEndDate.getFullYear() + 1);

  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      endDate: newEndDate,
      status: 'ACTIVE',
    },
  });

  return { newEndDate };
}

/**
 * Get the user's active subscription (if any).
 */
export async function getActiveSubscription(userId: string) {
  return db.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    include: {
      plan: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
