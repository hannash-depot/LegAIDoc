import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { wrapInHtmlDocument } from '@/lib/templates/renderer';
import { generatePdfFromHtml, PdfGenerationError } from '@/lib/pdf/generator';
import { FEATURE_PAYMENTS } from '@/lib/feature-flags';
import { isDocumentPaid } from '@/lib/payments/check-payment';
import type { Locale } from '@/lib/utils/locale';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/pdf — Download document as PDF
async function handler(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  // Ownership check
  if (document.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  // Payment gate — prevent PDF download for unpaid documents
  if (FEATURE_PAYMENTS) {
    const paid = await isDocumentPaid(document.id, session!.user!.id!, document.status);
    if (!paid) {
      return error('Payment required', 402, 'PAYMENT_REQUIRED');
    }
  }

  if (!document.renderedBody) {
    return error('Document has not been rendered yet', 400, 'NOT_RENDERED');
  }

  const isImmutable = ['PUBLISHED', 'SIGNED', 'ARCHIVED'].includes(document.status);

  // If it's immutable and we already cached the PDF in Blob Storage, redirect to it.
  if (isImmutable && document.pdfUrl && document.pdfUrl.startsWith('https://')) {
    return Response.redirect(document.pdfUrl, 302);
  }

  // Generate full HTML document
  let bodyHtml = document.renderedBody;

  // ESIG-06: Append audit trail page for signed documents
  if (document.status === 'SIGNED') {
    const auditTrailRecord = await db.siteSetting.findUnique({
      where: { key: `audit_trail:${document.id}` },
    });
    if (auditTrailRecord) {
      bodyHtml += '<div style="page-break-before: always;"></div>' + auditTrailRecord.value;
    }
  }

  const fullHtml = wrapInHtmlDocument(bodyHtml, document.locale as Locale, document.title);

  // Convert to PDF
  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await generatePdfFromHtml(fullHtml);
  } catch (err) {
    if (err instanceof PdfGenerationError) {
      return error('Failed to generate PDF. Please try again.', 502, 'PDF_GENERATION_FAILED');
    }
    throw err;
  }

  // If immutable, cache the generated PDF in Blob storage
  if (isImmutable) {
    try {
      const { uploadBlob } = await import('@/lib/storage/blob');
      const safeStatus = document.status.toLowerCase();
      const blobUrl = await uploadBlob(
        `documents/${document.id}-${safeStatus}.pdf`,
        Buffer.from(pdfBuffer),
        'application/pdf',
      );

      await db.document.update({
        where: { id: document.id },
        data: { pdfUrl: blobUrl },
      });

      return Response.redirect(blobUrl, 302);
    } catch (uploadErr) {
      logger.error(
        'Failed to upload PDF to blob storage, falling back to direct download',
        uploadErr,
      );
      // Fallback to direct download below
    }
  }

  // Sanitize filename: allowlist safe chars, collapse underscores, limit length
  let safeFilename = document.title
    .replace(/[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF\s_-]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+/, '')
    .slice(0, 200);

  if (!safeFilename) {
    safeFilename = 'document';
  }

  // RFC 5987 encoding for non-ASCII filenames
  const asciiFilename = safeFilename.replace(/[^\x20-\x7E]/g, '_');
  const utf8Filename = encodeURIComponent(safeFilename);

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${asciiFilename}.pdf"; filename*=UTF-8''${utf8Filename}.pdf`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}

// 10 PDF generations per minute per IP (expensive Puppeteer operation)
export const GET = withRateLimit(handler, { namespace: 'pdf-gen', maxRequests: 10 });
