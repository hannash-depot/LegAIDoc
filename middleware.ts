import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";
import { auth } from "@/lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

// Protected routes that require authentication
const protectedPaths = ["/dashboard", "/documents", "/wizard", "/admin", "/profile"];

// Public routes that should redirect to dashboard if authenticated
const authPaths = ["/login", "/register"];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  // Handle root path - redirect to default locale
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/he", request.url));
  }

  const isAuthenticated = !!request.auth;

  // Get the locale from the pathname
  const pathnameWithoutLocale = pathname.split("/").slice(2).join("/");
  const pathStart = `/${pathnameWithoutLocale.split("/")[0]}`;

  // Check if it's a protected path
  const isProtectedPath = protectedPaths.some((path) =>
    pathStart.startsWith(path)
  );

  // Check if it's an auth path
  const isAuthPath = authPaths.some((path) => pathStart.startsWith(path));

  // Redirect unauthenticated users to login
  if (isProtectedPath && !isAuthenticated) {
    const locale = pathname.split("/")[1];
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && isAuthenticated) {
    const locale = pathname.split("/")[1];
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Continue with i18n middleware
  return intlMiddleware(request as NextRequest);
});

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - API routes (/api/...)
    // - Next.js internals (/_next/...)
    // - Static files (files with extensions like .ico, .png, etc.)
    "/((?!api|_next|.*\\..*).*)",
  ],
};
