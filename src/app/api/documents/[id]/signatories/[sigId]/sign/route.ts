import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import {
  hashDocument,
  signDocumentHash,
  getPublicKey,
  generateTimestamp,
} from '@/lib/signatures/signature-service';
import { SignDocumentSchema } from '@/schemas/signature';
import { generateAuditTrailHtml } from '@/lib/pdf/audit-trail-page';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sigId: string }> },
) {
  try {
    const { id: documentId, sigId: signatoryId } = await context.params;
    const body = await request.json();

    // Validate payload
    const parsed = SignDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    // Fetch document and signatory
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: { signatories: true },
    });

    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    if (document.status !== 'PENDING_SIGNATURE') {
      return error('Document is not pending signature', 400, 'INVALID_STATUS');
    }

    const signatory = document.signatories.find((s) => s.id === signatoryId);

    if (!signatory) {
      return error('Signatory not found on this document', 404, 'NOT_FOUND');
    }

    if (signatory.signedAt) {
      return error('Signatory has already signed', 400, 'ALREADY_SIGNED');
    }

    // Must be verified via OTP (e.g., verified within the last 30 minutes)
    if (!signatory.verifiedAt) {
      return error(
        'Signatory is not verified. Please complete OTP verification.',
        401,
        'NOT_VERIFIED',
      );
    }

    // Optional: Ensure verification was recent (e.g., 30 mins)
    const verificationAgeMs = Date.now() - signatory.verifiedAt.getTime();
    if (verificationAgeMs > 30 * 60 * 1000) {
      return error(
        'Verification session expired. Please request a new OTP.',
        401,
        'VERIFICATION_EXPIRED',
      );
    }

    if (!document.renderedBody) {
      return error('Document has not been fully rendered yet.', 400, 'NOT_RENDERED');
    }

    // --- Execute Signature Logic (ESIG-03 & ESIG-04) ---

    // 1. Hash the document content
    const documentHash = hashDocument(document.renderedBody);

    // 2. Sign the hash
    const signatureBase64 = signDocumentHash(documentHash);

    // 3. Create Signature Record
    await db.signatureRecord.create({
      data: {
        documentId: document.id,
        signatoryId: signatory.id,
        hashAlgorithm: 'SHA-256',
        documentHash: documentHash,
        signature: signatureBase64,
        certificate: getPublicKey(), // Phase 2: mock cert
      },
    });

    // 4. Upload signature image to Cloud Storage if provided
    let signatureImageUrl: string | null = null;
    if (parsed.data.signatureImage) {
      const match = parsed.data.signatureImage.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const [, mimeType, base64Data] = match;
        const buffer = Buffer.from(base64Data, 'base64');
        const { uploadBlob } = await import('@/lib/storage/blob');
        signatureImageUrl = await uploadBlob(
          `signatures/${signatory.id}-${Date.now()}.png`,
          buffer,
          mimeType,
        );
      } else {
        // Fallback in case it's not a data URI (e.g. already a URL or raw base64)
        signatureImageUrl = parsed.data.signatureImage;
      }
    }

    // 5. Update the signatory's signedAt timestamp, signature image, and record IP/UserAgent for audit
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await db.signatory.update({
      where: { id: signatory.id },
      data: {
        signedAt: new Date(generateTimestamp()),
        signatureImage: signatureImageUrl, // ESIG-08: Now stores Cloud Storage URL
        ip: ip,
        userAgent: userAgent,
      },
    });

    // 6. Check if ALL signatories have now signed
    // document.signatories has stale data, so we re-fetch the specific statuses
    const allSignatories = await db.signatory.findMany({
      where: { documentId: document.id },
      select: { id: true, signedAt: true },
    });

    const allSigned = allSignatories.every((s) => s.signedAt !== null);

    if (allSigned) {
      // ESIG-06: Generate audit trail page and append to document body
      const completedSignatories = await db.signatory.findMany({
        where: { documentId: document.id },
      });

      const auditTrailHtml = generateAuditTrailHtml({
        documentId: document.id,
        documentTitle: document.title,
        documentHash: documentHash,
        signatories: completedSignatories.map((s) => ({
          name: s.name,
          email: s.email,
          role: s.role,
          verifiedAt: s.verifiedAt,
          signedAt: s.signedAt,
          ip: s.ip,
          userAgent: s.userAgent,
          signatureImage: s.signatureImage,
        })),
        signedAt: new Date(),
      });

      // Store audit trail as metadata; rendered body remains immutable
      await db.document.update({
        where: { id: document.id },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          documentHash: documentHash,
        },
      });

      // Store audit trail HTML in a SiteSetting keyed by document ID for PDF generation
      await db.siteSetting.upsert({
        where: { key: `audit_trail:${document.id}` },
        create: { key: `audit_trail:${document.id}`, value: auditTrailHtml },
        update: { value: auditTrailHtml },
      });

      logger.info('Document fully signed with audit trail', { documentId: document.id });
    }

    return success({ message: 'Document signed successfully', completelySigned: allSigned });
  } catch (err) {
    logger.error('Error applying signature', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
