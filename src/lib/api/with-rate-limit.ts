import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getEnvDefaults } from './rate-limit';

interface WithRateLimitOptions {
  /** Override max requests per window. If not set, uses env defaults based on auth status. */
  maxRequests?: number;
  /** Override window duration in ms. Default: from env. */
  windowMs?: number;
  /** Unique namespace to separate limits per route (e.g., "register", "pdf"). */
  namespace?: string;
}

/**
 * Extract client IP address from the request.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Wraps a Next.js API route handler with rate limiting.
 *
 * Usage:
 * ```ts
 * import { withRateLimit } from '@/lib/api/with-rate-limit';
 *
 * async function handler(request: NextRequest) { ... }
 *
 * export const POST = withRateLimit(handler, { namespace: 'register', maxRequests: 10 });
 * ```
 */
export function withRateLimit<TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<Response | NextResponse>,
  opts?: WithRateLimitOptions,
) {
  return async (request: NextRequest, ...args: TArgs): Promise<Response | NextResponse> => {
    const ip = getClientIp(request);
    const namespace = opts?.namespace || request.nextUrl.pathname;
    const identifier = `${namespace}:${ip}`;

    const env = getEnvDefaults();
    const maxRequests = opts?.maxRequests ?? env.maxUnauthenticated;

    const result = await rateLimit(identifier, {
      maxRequests,
      windowMs: opts?.windowMs ?? env.windowMs,
    });

    if (!result.success) {
      const retryAfterSeconds = Math.ceil(result.resetMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(retryAfterSeconds),
          },
        },
      );
    }

    // Add rate limit headers to the response
    const response = await handler(request, ...args);

    // Clone headers for immutable responses
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(maxRequests));
    headers.set('X-RateLimit-Remaining', String(result.remaining));

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
