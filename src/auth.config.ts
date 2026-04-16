import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config — used by middleware.
 * Providers with Node.js dependencies (bcryptjs, db) are defined in auth.ts.
 */
export default {
  providers: [],
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
