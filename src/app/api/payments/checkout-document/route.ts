import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { z } from 'zod/v4';
import { createDocumentCheckoutSession } from '@/lib/payments/providers/stripe-provider';
import { calculateVat } from '@/lib/payments/payment-service';

const CheckoutDocumentSchema = z.object({
  documentId: z.string().min(1),
});

// Default document price in agorot (₪49 = 4900 agorot)
function getDocumentPrice(): number {
  return parseInt(process.env.DOCUMENT_PRICE_ILS || '4900', 10);
}

/**
 * POST /api/payments/checkout-document — Create Stripe Checkout Session for a document.
 */
async function handler(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CheckoutDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid request data', 400, 'VALIDATION_ERROR');
    }

    const { documentId } = parsed.data;
    const userId = session!.user!.id!;

    // Fetch the document
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    if (document.userId !== userId) {
      return error('Forbidden', 403, 'FORBIDDEN');
    }

    // Check if already paid
    const existingPayment = await db.payment.findFirst({
      where: {
        documentId,
        status: 'COMPLETED',
      },
    });

    if (existingPayment) {
      return error('Document already paid for', 400, 'ALREADY_PAID');
    }

    // Check if user qualifies for free first document
    const publishedCount = await db.payment.count({
      where: {
        userId,
        documentId: { not: null },
        status: 'COMPLETED',
      },
    });

    if (publishedCount === 0) {
      // Free first document — mark as published directly
      await db.document.update({
        where: { id: documentId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });

      return success({ free: true, message: 'First document is free!' });
    }

    // Calculate price with VAT
    const netPrice = getDocumentPrice();
    const { gross } = calculateVat(netPrice);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const locale = document.locale || 'he';

    const { url, sessionId } = await createDocumentCheckoutSession({
      documentId,
      documentTitle: document.title,
      priceAgorot: gross,
      customerEmail: session!.user!.email!,
      userId,
      locale,
      successUrl: `${appUrl}/${locale}/documents/${documentId}?payment=success`,
      cancelUrl: `${appUrl}/${locale}/documents/${documentId}?payment=cancelled`,
    });

    // Create pending payment record
    const { net, vat } = calculateVat(netPrice);
    await db.payment.create({
      data: {
        userId,
        documentId,
        amount: net,
        vatAmount: vat,
        currency: 'ILS',
        status: 'PENDING',
        installments: 1,
        gatewayRef: sessionId,
      },
    });

    return success({ url, sessionId });
  } catch (err) {
    logger.error('Checkout document error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// 15 document checkouts per minute per IP
export const POST = withRateLimit(handler, { namespace: 'checkout-doc', maxRequests: 15 });
