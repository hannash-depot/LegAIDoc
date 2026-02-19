import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except: API routes, Next.js internals,
  // Vercel internals, and static files (anything with a dot extension).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/"],
};
