import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import {
  hashDocument,
  signDocumentHash,
  generateTimestamp,
  getPublicKey,
} from '@/lib/signatures/signature-service';
import { logAudit } from '@/lib/audit/audit-trail';
import { notifySignatureCompleted } from '@/lib/notifications';
import { z } from 'zod/v4';
import { headers } from 'next/headers';

const CompleteSigningSchema = z.object({
  signatoryId: z.string().min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/documents/[id]/sign/complete
 * ESIG-03/04/12: Execute signing for a verified signatory
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = CompleteSigningSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const signatory = await db.signatory.findUnique({
      where: { id: parsed.data.signatoryId },
      include: { document: true },
    });

    if (!signatory || signatory.documentId !== id) {
      return error('Signatory not found', 404, 'NOT_FOUND');
    }

    if (!signatory.verifiedAt) {
      return error('OTP must be verified before signing', 400, 'NOT_VERIFIED');
    }

    if (signatory.signedAt) {
      return error('Already signed', 400, 'ALREADY_SIGNED');
    }

    if (signatory.document.status !== 'PENDING_SIGNATURE') {
      return error('Document is not pending signature', 400, 'INVALID_STATUS');
    }

    // ESIG-03: Verify document hasn't been tampered with
    const currentHash = hashDocument(signatory.document.renderedBody || '');
    if (signatory.document.documentHash && currentHash !== signatory.document.documentHash) {
      return error(
        'Document has been modified since signing was initiated',
        400,
        'DOCUMENT_TAMPERED',
      );
    }

    const hdrs = await headers();
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = hdrs.get('user-agent') || undefined;

    // ESIG-03: Sign the document hash
    const signature = signDocumentHash(currentHash);
    const timestamp = generateTimestamp();

    await db.$transaction(async (tx) => {
      // Create signature record
      await tx.signatureRecord.create({
        data: {
          documentId: id,
          signatoryId: signatory.id,
          hashAlgorithm: 'SHA-256',
          documentHash: currentHash,
          signature,
          timestamp: new Date(timestamp),
          certificate: getPublicKey(),
        },
      });

      // Mark signatory as signed
      await tx.signatory.update({
        where: { id: signatory.id },
        data: {
          signedAt: new Date(),
          ip,
          userAgent,
        },
      });

      // Check if all signatories have signed
      const allSignatories = await tx.signatory.findMany({
        where: { documentId: id },
      });

      const allSigned = allSignatories.every((s) => s.id === signatory.id || s.signedAt !== null);

      // ESIG-12: Transition to SIGNED if all parties done
      if (allSigned) {
        await tx.document.update({
          where: { id },
          data: {
            status: 'SIGNED',
            signedAt: new Date(),
          },
        });
      }
    });

    // PRIV-05: Audit trail with ESIG-06 data
    await logAudit('signing.completed', 'document', id, null, {
      signatoryId: signatory.id,
      signatoryEmail: signatory.email,
      ip,
      userAgent,
      timestamp,
    });

    // Notify document owner that a signatory completed signing
    notifySignatureCompleted(
      signatory.document.userId,
      signatory.document.title,
      signatory.name,
      id,
    ).catch(() => {});

    // Check final status
    const updatedDoc = await db.document.findUnique({
      where: { id },
      select: { status: true },
    });

    return success({
      signed: true,
      signatoryId: signatory.id,
      documentStatus: updatedDoc?.status,
    });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
