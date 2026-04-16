import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { z } from 'zod/v4';
import { compare } from 'bcryptjs';

const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.literal('DELETE'),
});

/**
 * DELETE /api/account/delete
 * PRIV-06: Right to Erasure — permanently delete user account and all data.
 */
export async function DELETE(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = DeleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const userId = session!.user!.id!;

    // Verify password before deletion
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedPassword) {
      return error('Cannot verify identity', 400, 'NO_PASSWORD');
    }

    const validPassword = await compare(parsed.data.password, user.hashedPassword);
    if (!validPassword) {
      return error('Invalid password', 401, 'INVALID_PASSWORD');
    }

    // Log audit BEFORE deletion (so we have the user ID)
    await logAudit('account.deleted', 'user', userId, userId, {
      email: user.email,
    });

    // Hard-delete all user data in a transaction
    await db.$transaction([
      db.signatureRecord.deleteMany({
        where: { document: { userId } },
      }),
      db.signatory.deleteMany({
        where: { document: { userId } },
      }),
      db.document.deleteMany({ where: { userId } }),
      db.auditLog.deleteMany({ where: { userId } }),
      db.account.deleteMany({ where: { userId } }),
      db.session.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    return success({ deleted: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
