import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit/audit-trail';
import { calculateVat, chargePaymentGateway } from '@/lib/payments/payment-service';
import { buildItaPayload, requestItaAllocation } from '@/lib/payments/ita-service';
import { renderInvoiceHtml, generateInvoiceNumber } from '@/lib/payments/invoice-generator';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { FEATURE_PAYMENTS } from '@/lib/feature-flags';
import { z } from 'zod/v4';

const CheckoutSchema = z.object({
  planId: z.string().min(1),
  installments: z.number().int().min(1).max(12).default(1),
  customerVatNumber: z.string().length(9).optional(),
});

/**
 * POST /api/payments/checkout — Initiate payment for a plan.
 */
async function handler(request: NextRequest) {
  if (!FEATURE_PAYMENTS) return error('Payments are not enabled', 403, 'FEATURE_DISABLED');

  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid checkout data', 400, 'VALIDATION_ERROR');
    }

    const { planId, installments, customerVatNumber } = parsed.data;
    const userId = session!.user!.id!;

    // Fetch plan
    const plan = await db.plan.findUnique({ where: { id: planId, isActive: true } });
    if (!plan) {
      return error('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    // PAYM-09: Calculate VAT
    const { net, vat, gross } = calculateVat(plan.priceIls);

    // PAYM-01: Charge via gateway
    const user = await db.user.findUnique({ where: { id: userId } });
    const gatewayResult = await chargePaymentGateway({
      amount: gross,
      currency: 'ILS',
      installments,
      customerEmail: user!.email,
      description: `LegAIDoc — ${plan.nameEn}`,
    });

    if (!gatewayResult.success) {
      return error(gatewayResult.errorMessage || 'Payment failed', 400, 'PAYMENT_FAILED');
    }

    // PAYM-04: Request ITA allocation if B2B (has VAT number)
    let itaAllocationNumber: string | null = null;
    if (customerVatNumber) {
      try {
        const itaPayload = buildItaPayload(customerVatNumber, new Date(), gross);
        const itaResult = await requestItaAllocation(itaPayload);

        if (!itaResult.success) {
          await logAudit('payment.ita_failed', 'payment', 'N/A', userId, {
            itaError: itaResult.errorMessage,
            gross,
          });
        } else {
          itaAllocationNumber = itaResult.allocationNumber!;
        }
      } catch (itaErr) {
        logger.error('ITA Allocation error', itaErr);
        await logAudit('payment.ita_error', 'payment', 'N/A', userId, {
          error: String(itaErr),
        });
      }
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount: net,
        vatAmount: vat,
        currency: 'ILS',
        status: 'COMPLETED',
        installments,
        gatewayRef: gatewayResult.gatewayRef,
        itaAllocationNumber,
      },
    });

    // Create subscription
    const subscription = await db.subscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Update payment with subscription
    await db.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    // Generate invoice
    const invoiceNumber = await generateInvoiceNumber();
    renderInvoiceHtml({
      invoiceNumber,
      issueDate: new Date(),
      customerName: user!.name || user!.email,
      customerVatNumber,
      items: [{ description: plan.nameHe, amount: net }],
      netAmount: net,
      vatAmount: vat,
      grossAmount: gross,
      itaAllocationNumber: itaAllocationNumber || undefined,
      installments,
    });

    const invoice = await db.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber,
        type: 'TAX_RECEIPT',
        amount: net,
        vatAmount: vat,
        itaAllocationNumber,
      },
    });

    await logAudit('payment.completed', 'payment', payment.id, userId, {
      planId,
      amount: gross,
      installments,
      invoiceNumber,
    });

    return success(
      {
        payment,
        subscription,
        invoice,
      },
      201,
    );
  } catch (err) {
    logger.error('Checkout error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// 15 checkout attempts per minute per IP
export const POST = withRateLimit(handler, { namespace: 'checkout', maxRequests: 15 });
