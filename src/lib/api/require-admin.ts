import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { error } from './response';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Shared helper to check if a user is an admin via role or whitelist.
 */
export function isUserAdmin(
  user: { email?: string | null; role?: string | null } | undefined | null,
) {
  if (!user) return false;

  return user.role === 'ADMIN';
}

function validateCsrf(request: NextRequest): ReturnType<typeof error> | null {
  if (!STATE_CHANGING_METHODS.has(request.method)) return null;

  const origin = request.headers.get('origin');
  const expectedOrigin = request.nextUrl.origin;

  if (origin) {
    if (origin !== expectedOrigin) {
      return error('CSRF validation failed', 403, 'CSRF_ERROR');
    }
    return null;
  }

  // No Origin header — fall back to Referer.
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return error('CSRF validation failed', 403, 'CSRF_ERROR');
      }
    } catch {
      return error('CSRF validation failed', 403, 'CSRF_ERROR');
    }
  }
  // If neither Origin nor Referer is present, allow (server-to-server / non-browser).
  return null;
}

/**
 * Used in API routes. Pass `request` on state-changing handlers to enforce
 * CSRF origin/referer validation in addition to admin auth.
 */
export async function requireAdmin(request?: NextRequest) {
  if (request) {
    const csrfError = validateCsrf(request);
    if (csrfError) return { error: csrfError, session: null };
  }

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
