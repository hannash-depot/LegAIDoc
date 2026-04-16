import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock feature flag before importing the service
vi.mock('@/lib/feature-flags', () => ({
  FEATURE_NOTIFICATIONS: true,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

const { db } = await import('@/lib/db');
const {
  notifySignatureRequested,
  notifySignatureCompleted,
  notifyDocumentComment,
  notifyAnalysisComplete,
  notifyPaymentReceipt,
} = await import('@/lib/notifications');

describe('notification-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user has notifications enabled
    vi.mocked(db.user.findUnique).mockResolvedValue({
      notificationPrefs: { emailNotifications: true, inAppNotifications: true },
    } as never);
    vi.mocked(db.notification.create).mockResolvedValue({} as never);
  });

  it('creates a notification for signatureRequested', async () => {
    await notifySignatureRequested('user-1', 'My Contract', 'doc-1');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'SIGNATURE_REQUESTED',
        titleKey: 'notifications.signatureRequested.title',
        bodyKey: 'notifications.signatureRequested.body',
        params: { documentTitle: 'My Contract' },
        link: '/documents/doc-1',
      }),
    });
  });

  it('creates a notification for signatureCompleted with signer name', async () => {
    await notifySignatureCompleted('user-1', 'My Contract', 'Jane Doe', 'doc-1');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'SIGNATURE_COMPLETED',
        params: { documentTitle: 'My Contract', signerName: 'Jane Doe' },
      }),
    });
  });

  it('creates a notification for documentComment', async () => {
    await notifyDocumentComment('user-1', 'My Doc', 'Alice', 'doc-1');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'DOCUMENT_COMMENT',
        params: { documentTitle: 'My Doc', authorName: 'Alice' },
        link: '/documents/doc-1',
      }),
    });
  });

  it('creates a notification for analysisComplete', async () => {
    await notifyAnalysisComplete('user-1', 'Lease Agreement', 'contract-1');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'ANALYSIS_COMPLETE',
        params: { contractTitle: 'Lease Agreement' },
        link: '/analyze/contract-1',
      }),
    });
  });

  it('creates a notification for paymentReceipt', async () => {
    await notifyPaymentReceipt('user-1', '₪100.00', 'INV-2026-001');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PAYMENT_RECEIPT',
        params: { amount: '₪100.00', invoiceNumber: 'INV-2026-001' },
        link: '/settings',
      }),
    });
  });

  it('skips notification when user has inAppNotifications disabled', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      notificationPrefs: { emailNotifications: true, inAppNotifications: false },
    } as never);

    await notifySignatureRequested('user-1', 'My Contract', 'doc-1');

    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it('does not throw when DB creation fails', async () => {
    vi.mocked(db.notification.create).mockRejectedValue(new Error('DB error'));

    // Should not throw
    await expect(
      notifySignatureRequested('user-1', 'My Contract', 'doc-1'),
    ).resolves.toBeUndefined();
  });
});
