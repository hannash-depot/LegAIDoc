import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { verifyOtp } from '@/lib/signatures/signature-service';
import { VerifyOtpSchema } from '@/schemas/signature';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sigId: string }> },
) {
  try {
    const { id: documentId, sigId: signatoryId } = await context.params;
    const body = await request.json();

    // Validate payload
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    const signatory = await db.signatory.findFirst({
      where: {
        id: signatoryId,
        documentId: documentId,
      },
    });

    if (!signatory) {
      return error('Signatory not found', 404, 'NOT_FOUND');
    }

    if (!signatory.otpHash || !signatory.otpExpiresAt) {
      return error('OTP was not requested', 400, 'NO_OTP_REQUESTED');
    }

    if (new Date() > signatory.otpExpiresAt) {
      return error('OTP has expired', 400, 'OTP_EXPIRED');
    }

    // Verify OTP
    const isValid = verifyOtp(parsed.data.otp, signatory.otpHash);

    if (!isValid) {
      return error('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Update verify status
    await db.signatory.update({
      where: { id: signatory.id },
      data: {
        verifiedAt: new Date(),
        otpHash: null,
        otpExpiresAt: null, // Clear after successful verification
      },
    });

    return success({ message: 'Identity verified successfully' });
  } catch (err) {
    logger.error('Error verifying OTP', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
