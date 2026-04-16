import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { generateOtp } from '@/lib/signatures/signature-service';
import { sendOtpEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { FEATURE_EMAILS } from '@/lib/feature-flags';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sigId: string }> },
) {
  try {
    const { id: documentId, sigId: signatoryId } = await context.params;

    // Fetch signatory and verify document exists
    const signatory = await db.signatory.findFirst({
      where: {
        id: signatoryId,
        documentId: documentId,
        document: { status: 'PENDING_SIGNATURE' }, // Ensure doc is signable
      },
      include: { document: true },
    });

    if (!signatory) {
      return error('Signatory not found or document not ready for signing', 404, 'NOT_FOUND');
    }

    // Generate OTP
    const { otp, hash, expiresAt } = generateOtp();

    // Save OTP info to signatory
    await db.signatory.update({
      where: { id: signatory.id },
      data: {
        otpHash: hash,
        otpExpiresAt: expiresAt,
      },
    });

    // Send OTP via email
    if (FEATURE_EMAILS && signatory.email) {
      const result = await sendOtpEmail({
        to: signatory.email,
        otp,
        documentTitle: signatory.document.title || 'Document',
        signatoryName: signatory.name,
        locale: signatory.document.locale || 'he',
      });
      if (!result.success) {
        logger.error('Failed to send OTP email', undefined, {
          signatoryId,
          documentId,
        });
      }
    } else {
      logger.info('OTP generated (email delivery disabled)', {
        signatoryId,
        documentId,
        emailsEnabled: FEATURE_EMAILS,
      });
    }

    return success({ message: 'OTP sent successfully' });
  } catch (err) {
    logger.error('Error in OTP generation', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
