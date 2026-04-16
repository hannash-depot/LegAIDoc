import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { ProfileUpdateSchema } from '@/schemas/account';

/**
 * PUT /api/account/profile
 * DASH-03: Update user profile (name, preferred locale).
 */
export async function PUT(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = ProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const userId = session!.user!.id!;

    await db.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        preferredLocale: parsed.data.preferredLocale,
        companyName: parsed.data.companyName || null,
        idNumber: parsed.data.idNumber || null,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
      },
    });

    await logAudit('account.profile_updated', 'user', userId, userId, {
      name: parsed.data.name,
      preferredLocale: parsed.data.preferredLocale,
      companyName: parsed.data.companyName,
      idNumber: parsed.data.idNumber,
      address: parsed.data.address,
      phone: parsed.data.phone,
    });

    return success({ updated: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
