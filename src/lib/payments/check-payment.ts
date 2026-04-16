import { db } from '@/lib/db';

/**
 * Check whether a document has been paid for (or is free).
 * First document per user is free. A document is also considered paid
 * if it has a completed payment or its status is PUBLISHED/SIGNED.
 */
export async function isDocumentPaid(
  documentId: string,
  userId: string,
  documentStatus: string,
): Promise<boolean> {
  if (documentStatus === 'PUBLISHED' || documentStatus === 'SIGNED') return true;

  const [paidPayment, paidDocCount] = await Promise.all([
    db.payment.findFirst({
      where: { documentId, status: 'COMPLETED' },
    }),
    db.payment.count({
      where: { userId, documentId: { not: null }, status: 'COMPLETED' },
    }),
  ]);

  // First document is free (no completed doc-level payments yet), or this doc has a payment
  return !!paidPayment || paidDocCount === 0;
}
