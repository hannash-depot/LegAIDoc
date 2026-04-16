import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { verifyOtp } from '@/lib/signatures/signature-service';
import { logAudit } from '@/lib/audit/audit-trail';
import { z } from 'zod/v4';
import { headers } from 'next/headers';

const VerifyOtpSchema = z.object({
  signatoryId: z.string().min(1),
  otp: z.string().length(6),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/documents/[id]/sign/verify-otp
 * ESIG-07: Verify OTP for a signatory before allowing signing
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

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

    if (signatory.verifiedAt) {
      return error('OTP already verified', 400, 'ALREADY_VERIFIED');
    }

    if (signatory.otpExpiresAt && signatory.otpExpiresAt < new Date()) {
      return error('OTP has expired', 410, 'OTP_EXPIRED');
    }

    if (!signatory.otpHash || !verifyOtp(parsed.data.otp, signatory.otpHash)) {
      return error('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Mark as verified
    const hdrs = await headers();
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = hdrs.get('user-agent') || undefined;

    await db.signatory.update({
      where: { id: signatory.id },
      data: {
        verifiedAt: new Date(),
        ip,
        userAgent,
      },
    });

    // PRIV-05: Audit
    await logAudit('signing.otp_verified', 'document', id, null, {
      signatoryId: signatory.id,
      signatoryEmail: signatory.email,
    });

    return success({ verified: true, signatoryId: signatory.id });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
