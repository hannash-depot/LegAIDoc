import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import authConfig from '@/auth.config';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

const intlMiddleware = createIntlMiddleware(routing);

// Paths that require authentication (locale prefix is stripped before matching)
const protectedPaths = new Set(['/wizard', '/documents', '/admin', '/settings', '/checkout']);

// Auth page paths — redirect authenticated users away from these
const authPaths = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

// Pre-compute the static CSP directives (everything except the nonce)
const CSP_STATIC = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' *.sentry.io",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function getPathnameWithoutLocale(pathname: string): string {
  const localePattern = /^\/(he|ar|en|ru)(\/|$)/;
  return pathname.replace(localePattern, '/');
}

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Always run intl middleware first for locale handling
  const intlResponse = intlMiddleware(req);

  // Skip auth checks for API routes and static files (AUTH-10)
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return intlResponse;
  }

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();

  // Generate CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const pathWithoutLocale = getPathnameWithoutLocale(pathname);
  const session = (req as unknown as { auth: { user?: { id: string } } | null }).auth;
  const isAuthenticated = !!session?.user;

  // Extract locale from pathname for redirect URLs
  const localeMatch = pathname.match(/^\/(he|ar|en|ru)/);
  const locale = localeMatch ? localeMatch[1] : 'he';

  // AUTH-09: Redirect unauthenticated users from protected routes
  const firstSegment = pathWithoutLocale.split('/')[1] || '';
  const isProtected = protectedPaths.has('/' + firstSegment);
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // AUTH-09: Redirect authenticated users away from auth pages
  const isAuthPage = authPaths.has(pathWithoutLocale);
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/templates`, req.nextUrl.origin));
  }

  // Add security and tracing headers to the response
  const response = intlResponse || NextResponse.next();
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-nonce', nonce);

  // Content Security Policy — enforced in production, report-only in development
  const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ${CSP_STATIC}`;
  const cspHeader =
    process.env.NODE_ENV === 'production'
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only';

  response.headers.set(cspHeader, csp);

  return response;
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
