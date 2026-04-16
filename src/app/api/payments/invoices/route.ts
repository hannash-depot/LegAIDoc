import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success } from '@/lib/api/response';

/**
 * GET /api/payments/invoices — List user's invoices.
 */
export async function GET() {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const invoices = await db.invoice.findMany({
    where: { payment: { userId: session!.user!.id! } },
    include: {
      payment: {
        select: {
          amount: true,
          vatAmount: true,
          currency: true,
          installments: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(invoices);
}
