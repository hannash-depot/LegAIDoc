import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { renderInvoiceHtml } from '@/lib/payments/invoice-generator';
import { generatePdfFromHtml } from '@/lib/payments/pdf-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error: authError, session } = await requireAuth();

  if (authError) return authError;

  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            user: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return error('Invoice not found', 404, 'NOT_FOUND');
    }

    // Ensure user owns this invoice
    if (invoice.payment.userId !== session!.user!.id!) {
      return error('Unauthorized', 403, 'FORBIDDEN');
    }

    // Reconstruct the invoice data for rendering
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.createdAt,
      customerName: invoice.payment.user.name || invoice.payment.user.email,
      // Assuming no VAT number saved on user profile yet, but we'd pull it here if B2B
      items: [
        {
          description: invoice.payment.subscription?.plan?.nameHe || 'מנוי LegAIDoc',
          amount: invoice.amount,
        },
      ],
      netAmount: invoice.amount,
      vatAmount: invoice.vatAmount,
      grossAmount: invoice.amount + invoice.vatAmount,
      itaAllocationNumber: invoice.itaAllocationNumber || undefined,
      installments: invoice.payment.installments,
    };

    const html = renderInvoiceHtml(invoiceData);

    let pdfBuffer: Uint8Array;
    try {
      pdfBuffer = await generatePdfFromHtml(html);
    } catch (pdfErr) {
      logger.error('Failed to generate PDF with puppeteer', pdfErr);
      // Fallback: send HTML if PDF generation completely fails
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    logger.error('Error downloading invoice', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
