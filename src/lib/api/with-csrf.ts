import { NextRequest, NextResponse } from 'next/server';
import { error } from './response';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Wraps a Next.js API route handler with CSRF origin validation.
 *
 * For state-changing requests (POST/PUT/PATCH/DELETE), verifies that the
 * Origin header matches the request's own origin. This prevents cross-site
 * request forgery from browser-based attacks.
 *
 * Usage:
 * ```ts
 * import { withCsrf } from '@/lib/api/with-csrf';
 *
 * async function handler(request: NextRequest) { ... }
 *
 * export const POST = withCsrf(handler);
 * ```
 */
export function withCsrf<TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<Response | NextResponse>,
) {
  return async (request: NextRequest, ...args: TArgs): Promise<Response | NextResponse> => {
    if (STATE_CHANGING_METHODS.has(request.method)) {
      const origin = request.headers.get('origin');
      const expectedOrigin = request.nextUrl.origin;

      // If Origin header is present, it must match our own origin
      if (origin && origin !== expectedOrigin) {
        return error('CSRF validation failed', 403, 'CSRF_ERROR');
      }

      // If no Origin, check Referer as fallback
      if (!origin) {
        const referer = request.headers.get('referer');
        if (referer) {
          try {
            const refererOrigin = new URL(referer).origin;
            if (refererOrigin !== expectedOrigin) {
              return error('CSRF validation failed', 403, 'CSRF_ERROR');
            }
          } catch {
            return error('CSRF validation failed', 403, 'CSRF_ERROR');
          }
        }
        // If neither Origin nor Referer is present, allow the request.
        // This covers server-to-server calls and non-browser clients.
      }
    }

    return handler(request, ...args);
  };
}
