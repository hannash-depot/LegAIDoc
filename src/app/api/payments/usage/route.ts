import { requireAuth } from '@/lib/api/require-auth';
import { success } from '@/lib/api/response';
import { getUserUsage } from '@/lib/payments/usage-limits';

/**
 * GET /api/payments/usage — Get current user's plan usage info.
 */
export async function GET() {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const usage = await getUserUsage(session!.user!.id!);
  return success(usage);
}
