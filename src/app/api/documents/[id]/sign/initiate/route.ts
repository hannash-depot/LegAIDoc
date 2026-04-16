import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { hashDocument, generateOtp } from '@/lib/signatures/signature-service';
import { logAudit } from '@/lib/audit/audit-trail';
import { FEATURE_ESIG, FEATURE_EMAILS, FEATURE_NOTIFICATIONS } from '@/lib/feature-flags';
import { notifySignatureRequested } from '@/lib/notifications';
import { sendSignatureRequestEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { z } from 'zod/v4';

const InitiateSigningSchema = z.object({
  signatories: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.email(),
        role: z.enum(['INITIATOR', 'COUNTER_PARTY']),
      }),
    )
    .min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/documents/[id]/sign/initiate
 * ESIG-12: Transitions DRAFT → PENDING_SIGNATURE, creates signatories, sends OTPs
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!FEATURE_ESIG) return error('Electronic signatures are not enabled', 403, 'FEATURE_DISABLED');
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    // Fetch document with ownership check
    const document = await db.document.findUnique({
      where: { id },
      include: { template: { include: { category: true } } },
    });

    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    if (document.userId !== session!.user!.id) {
      return error('Not authorized', 403, 'FORBIDDEN');
    }

    if (document.status !== 'DRAFT') {
      return error('Document must be in DRAFT status to initiate signing', 400, 'INVALID_STATUS');
    }

    // ESIG-05: Block signing for wet-ink-only categories
    if (document.template.category.requiresWetInk) {
      return error(
        'This document category requires wet-ink signature only',
        400,
        'WET_INK_REQUIRED',
      );
    }

    const body = await request.json();
    const parsed = InitiateSigningSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // ESIG-03: Hash the finalized document content
    const docHash = hashDocument(document.renderedBody || '');

    // Create signatories with OTPs in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update document status and hash
      await tx.document.update({
        where: { id },
        data: {
          status: 'PENDING_SIGNATURE',
          documentHash: docHash,
        },
      });

      // Create signatory records with OTPs
      const signatoryRecords = [];
      for (const sig of parsed.data.signatories) {
        const { hash: otpHash, expiresAt } = generateOtp();
        // In production: send OTP via email here
        const record = await tx.signatory.create({
          data: {
            documentId: id,
            name: sig.name,
            email: sig.email,
            role: sig.role,
            otpHash,
            otpExpiresAt: expiresAt,
          },
        });
        signatoryRecords.push(record);
      }

      return signatoryRecords;
    });

    // PRIV-05: Audit trail
    await logAudit('signing.initiated', 'document', id, session!.user!.id!, {
      signatoryCount: result.length,
    });

    // ESIG-11: Send signature request emails with 7-day expiry links
    if (FEATURE_EMAILS) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const expiresAtFormatted = new Intl.DateTimeFormat('en-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem',
        hour12: false,
      }).format(expiresAt);

      const senderUser = await db.user.findUnique({
        where: { id: session!.user!.id! },
        select: { name: true, preferredLocale: true },
      });

      for (const sig of result) {
        const signingUrl = `${appUrl}/${senderUser?.preferredLocale || 'he'}/sign/${id}/${sig.id}`;
        sendSignatureRequestEmail({
          to: sig.email,
          signatoryName: sig.name,
          senderName: senderUser?.name || 'LegAIDoc User',
          documentTitle: document.title,
          signingUrl,
          expiresAt: expiresAtFormatted,
          locale: senderUser?.preferredLocale || 'he',
        }).catch((err) => {
          logger.error('Failed to send signature request email', err, { signatoryId: sig.id });
        });
      }
    }

    // Notify signatories who have user accounts
    if (FEATURE_NOTIFICATIONS) {
      for (const sig of result) {
        const sigUser = await db.user.findUnique({
          where: { email: sig.email },
          select: { id: true },
        });
        if (sigUser) {
          notifySignatureRequested(sigUser.id, document.title, id).catch(() => {});
        }
      }
    }

    return success({
      status: 'PENDING_SIGNATURE',
      signatories: result.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        verified: false,
        signed: false,
      })),
    });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
