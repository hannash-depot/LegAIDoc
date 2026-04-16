import { auth } from '@/auth';
import { error } from './response';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Shared helper to check if a user is an admin via role or whitelist.
 */
export function isUserAdmin(
  user: { email?: string | null; role?: string | null } | undefined | null,
) {
  if (!user) return false;

  return user.role === 'ADMIN';
}

/**
 * Used in API routes.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { error: error('Unauthorized', 401), session: null };
  }

  if (!isUserAdmin(session.user)) {
    logger.warn('API admin access denied', {
      email: session.user.email,
      role: session.user.role,
    });
    return { error: error('Forbidden', 403), session: null };
  }

  return { error: null, session };
}

/**
 * Used in Server Components (Layouts/Pages) to protect routes.
 * Redirects to home if not an admin.
 */
export async function requireAdminPage() {
  const session = await auth();

  if (!session?.user) {
    logger.info('Admin page access without session, redirecting to login');
    redirect('/login');
  }

  if (!isUserAdmin(session.user)) {
    logger.warn('Admin page access denied', {
      email: session.user.email,
      role: session.user.role,
    });
    redirect('/');
  }

  return session;
}
