import { db } from '@/lib/db';

export interface UsageInfo {
  hasActiveSubscription: boolean;
  planName: string | null;
  documentLimit: number; // -1 = unlimited
  documentsUsed: number;
  canCreateDocument: boolean;
}

/**
 * Check user's document usage against their plan limits.
 * Returns usage info including whether the user can create more documents.
 */
export async function getUserUsage(userId: string): Promise<UsageInfo> {
  const subscription = await db.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    include: {
      plan: { select: { nameEn: true, documentLimit: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    // No subscription — allow free tier (1 free document via checkout-document)
    return {
      hasActiveSubscription: false,
      planName: null,
      documentLimit: 0,
      documentsUsed: 0,
      canCreateDocument: true, // wizard is always accessible; paywall at PDF download
    };
  }

  const documentLimit = subscription.plan.documentLimit;

  // Unlimited plan
  if (documentLimit === -1) {
    return {
      hasActiveSubscription: true,
      planName: subscription.plan.nameEn,
      documentLimit: -1,
      documentsUsed: 0,
      canCreateDocument: true,
    };
  }

  // Count documents created during current subscription period
  const documentsUsed = await db.document.count({
    where: {
      userId,
      createdAt: { gte: subscription.startDate },
      status: { not: 'ARCHIVED' },
    },
  });

  return {
    hasActiveSubscription: true,
    planName: subscription.plan.nameEn,
    documentLimit,
    documentsUsed,
    canCreateDocument: documentsUsed < documentLimit,
  };
}
