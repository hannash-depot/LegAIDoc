import { NotificationType } from '@prisma/client';

import { db } from '@/lib/db';
import { FEATURE_NOTIFICATIONS } from '@/lib/feature-flags';
import { logger } from '@/lib/logger';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string>;
  link?: string;
}

async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!FEATURE_NOTIFICATIONS) return;

  try {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { notificationPrefs: true },
    });

    const prefs = user?.notificationPrefs as { inAppNotifications?: boolean } | null;
    if (prefs?.inAppNotifications === false) return;

    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        titleKey: input.titleKey,
        bodyKey: input.bodyKey,
        params: input.params ?? undefined,
        link: input.link ?? undefined,
      },
    });
  } catch (err) {
    logger.error('Notification creation failed', err, { type: input.type, userId: input.userId });
  }
}

export async function notifySignatureRequested(
  userId: string,
  documentTitle: string,
  documentId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'SIGNATURE_REQUESTED',
    titleKey: 'notifications.signatureRequested.title',
    bodyKey: 'notifications.signatureRequested.body',
    params: { documentTitle },
    link: `/documents/${documentId}`,
  });
}

export async function notifySignatureCompleted(
  userId: string,
  documentTitle: string,
  signerName: string,
  documentId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'SIGNATURE_COMPLETED',
    titleKey: 'notifications.signatureCompleted.title',
    bodyKey: 'notifications.signatureCompleted.body',
    params: { documentTitle, signerName },
    link: `/documents/${documentId}`,
  });
}

export async function notifySignatureExpired(
  userId: string,
  documentTitle: string,
  documentId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'SIGNATURE_EXPIRED',
    titleKey: 'notifications.signatureExpired.title',
    bodyKey: 'notifications.signatureExpired.body',
    params: { documentTitle },
    link: `/documents/${documentId}`,
  });
}

export async function notifyDocumentShared(
  userId: string,
  documentTitle: string,
  documentId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'DOCUMENT_SHARED',
    titleKey: 'notifications.documentShared.title',
    bodyKey: 'notifications.documentShared.body',
    params: { documentTitle },
    link: `/documents/${documentId}`,
  });
}

export async function notifyDocumentComment(
  userId: string,
  documentTitle: string,
  authorName: string,
  documentId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'DOCUMENT_COMMENT',
    titleKey: 'notifications.documentComment.title',
    bodyKey: 'notifications.documentComment.body',
    params: { documentTitle, authorName },
    link: `/documents/${documentId}`,
  });
}

export async function notifyAnalysisComplete(
  userId: string,
  contractTitle: string,
  contractId: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'ANALYSIS_COMPLETE',
    titleKey: 'notifications.analysisComplete.title',
    bodyKey: 'notifications.analysisComplete.body',
    params: { contractTitle },
    link: `/analyze/${contractId}`,
  });
}

export async function notifyPaymentReceipt(
  userId: string,
  amount: string,
  invoiceNumber: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'PAYMENT_RECEIPT',
    titleKey: 'notifications.paymentReceipt.title',
    bodyKey: 'notifications.paymentReceipt.body',
    params: { amount, invoiceNumber },
    link: '/settings',
  });
}

export async function notifySubscriptionExpiring(
  userId: string,
  expiryDate: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'SUBSCRIPTION_EXPIRING',
    titleKey: 'notifications.subscriptionExpiring.title',
    bodyKey: 'notifications.subscriptionExpiring.body',
    params: { expiryDate },
    link: '/settings',
  });
}

export async function notifyUsageLimitApproaching(
  userId: string,
  current: string,
  limit: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'USAGE_LIMIT_APPROACHING',
    titleKey: 'notifications.usageLimitApproaching.title',
    bodyKey: 'notifications.usageLimitApproaching.body',
    params: { current, limit },
    link: '/settings',
  });
}

export async function notifyAdminTemplateUpdated(
  userId: string,
  templateName: string,
): Promise<void> {
  await createNotification({
    userId,
    type: 'ADMIN_TEMPLATE_UPDATED',
    titleKey: 'notifications.adminTemplateUpdated.title',
    bodyKey: 'notifications.adminTemplateUpdated.body',
    params: { templateName },
    link: '/templates',
  });
}
