import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit/audit-trail';
import { refundPaymentGateway } from '@/lib/payments/payment-service';
import { generateInvoiceNumber } from '@/lib/payments/invoice-generator';
import { requestItaCreditAllocation, buildItaPayload } from '@/lib/payments/ita-service';
import { z } from 'zod/v4';

const RefundSchema = z.object({
  reason: z.string().min(1).max(500),
  amount: z.number().int().positive().optional(), // partial refund in agorot; omit for full
});

/**
 * POST /api/admin/payments/[id]/refund — Issue a refund + credit invoice.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, session } = await requireAdmin();
  if (authError) return authError;

  const { id: paymentId } = await params;

  try {
    const body = await request.json();
    const parsed = RefundSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid refund data', 400, 'VALIDATION_ERROR');
    }

    const { reason, amount: requestedAmount } = parsed.data;

    // Fetch the payment
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoices: { where: { type: 'CREDIT_INVOICE' } },
      },
    });

    if (!payment) {
      return error('Payment not found', 404, 'NOT_FOUND');
    }

    if (payment.status !== 'COMPLETED') {
      return error('Only completed payments can be refunded', 400, 'INVALID_STATUS');
    }

    // Calculate refund amount
    const grossPaid = payment.amount + payment.vatAmount;
    const alreadyRefunded = payment.invoices.reduce(
      (sum, inv) => sum + inv.amount + inv.vatAmount,
      0,
    );
    const refundableAmount = grossPaid - alreadyRefunded;

    if (refundableAmount <= 0) {
      return error('Payment has already been fully refunded', 400, 'ALREADY_REFUNDED');
    }

    const refundGross = requestedAmount
      ? Math.min(requestedAmount, refundableAmount)
      : refundableAmount;

    // Split refund into net + VAT (same ratio as original payment)
    const vatRatio = payment.vatAmount / grossPaid;
    const refundVat = Math.round(refundGross * vatRatio);
    const refundNet = refundGross - refundVat;

    // Issue refund via payment gateway
    if (payment.gatewayRef) {
      const gatewayResult = await refundPaymentGateway({
        gatewayRef: payment.gatewayRef,
        amount: refundGross,
        reason,
      });

      if (!gatewayResult.success) {
        return error(
          gatewayResult.errorMessage || 'Gateway refund failed',
          502,
          'GATEWAY_REFUND_FAILED',
        );
      }
    }

    // Request ITA credit allocation if original had one
    let itaCreditAllocation: string | null = null;
    if (payment.itaAllocationNumber) {
      try {
        const itaPayload = buildItaPayload(
          '000000000', // credit invoices use seller's VAT
          new Date(),
          refundGross,
        );
        const itaResult = await requestItaCreditAllocation(itaPayload);
        if (itaResult.success) {
          itaCreditAllocation = itaResult.allocationNumber!;
        }
      } catch {
        // ITA credit allocation failure is non-blocking
      }
    }

    // Create credit invoice
    const creditInvoice = await db.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber: await generateInvoiceNumber(),
        type: 'CREDIT_INVOICE',
        amount: refundNet,
        vatAmount: refundVat,
        itaAllocationNumber: itaCreditAllocation,
      },
    });

    // Update payment status if fully refunded
    const isFullRefund = refundGross >= refundableAmount;
    if (isFullRefund) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    await logAudit('admin.payment_refunded', 'payment', payment.id, session!.user!.id!, {
      refundAmount: refundGross,
      refundNet,
      refundVat,
      isFullRefund,
      reason,
      creditInvoiceNumber: creditInvoice.invoiceNumber,
    });

    return success(
      {
        creditInvoice,
        refundAmount: refundGross,
        isFullRefund,
      },
      201,
    );
  } catch (err) {
    logger.error('Refund error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
