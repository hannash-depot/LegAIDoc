import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

const MfaCheckSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/mfa/check
 * PRIV-02: Checks if an email has MFA enabled. Called by login form
 * after credential validation to determine if MFA step is needed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = MfaCheckSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid email', 400, 'VALIDATION_ERROR');
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { mfaEnabled: true },
    });

    // Always return a response to prevent user enumeration
    return success({ mfaRequired: user?.mfaEnabled ?? false });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
