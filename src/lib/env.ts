import { z } from 'zod/v4';

/**
 * Server-side environment variable validation.
 * Throws on import if required variables are missing.
 */

const serverSchema = z
  .object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Auth
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    // App
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['he', 'ar', 'en', 'ru']).default('he'),

    // PDF
    PDF_STORAGE_DIR: z.string().default('./storage/pdfs'),

    // Payments
    PAYMENT_PROVIDER: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    DOCUMENT_PRICE_ILS: z.string().optional(),
    PAYMENT_WEBHOOK_SECRET: z.string().optional(),

    // AI
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),

    // Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('LegAIDoc <noreply@legaidoc.co.il>'),

    // Sentry
    SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
    RATE_LIMIT_MAX_AUTHENTICATED: z.string().default('100'),
    RATE_LIMIT_MAX_UNAUTHENTICATED: z.string().default('20'),

    // Upstash Redis (required in production for distributed rate limiting)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Feature Flags
    NEXT_PUBLIC_FEATURE_ESIG: z.string().default('false'),
    NEXT_PUBLIC_FEATURE_PAYMENTS: z.string().default('false'),
    NEXT_PUBLIC_FEATURE_AI_IMPORT: z.string().default('false'),
    NEXT_PUBLIC_FEATURE_EMAILS: z.string().default('false'),

    // Electronic Signatures (required in production when ESIG is enabled)
    ESIG_RSA_PRIVATE_KEY: z.string().optional(),
    ESIG_RSA_PUBLIC_KEY: z.string().optional(),

    // OTP
    ESIG_OTP_EXPIRY_MINUTES: z.string().default('15'),

    // Encryption
    FIELD_ENCRYPTION_KEY: z
      .string()
      .length(
        64,
        'FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32',
      )
      .optional(),

    // Business (invoice generation)
    ITA_SOFTWARE_NUMBER: z.string().default('999999999'),
    BUSINESS_NAME: z.string().default('LegAIDoc'),
    BUSINESS_VAT_NUMBER: z.string().optional(),
    BUSINESS_ADDRESS: z.string().optional(),
    BUSINESS_PHONE: z.string().optional(),
    BUSINESS_EMAIL: z.string().default('support@legaidoc.co.il'),

    // Node
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  })
  .superRefine((data, ctx) => {
    // In production, encryption key is required
    if (data.NODE_ENV === 'production' && !data.FIELD_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['FIELD_ENCRYPTION_KEY'],
        message:
          'FIELD_ENCRYPTION_KEY is required in production. Generate with: openssl rand -hex 32',
      });
    }

    // If payments are enabled, PAYMENT_PROVIDER must be explicitly set (no silent mock fallback)
    if (
      data.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true' &&
      (!data.PAYMENT_PROVIDER || data.PAYMENT_PROVIDER === 'mock') &&
      data.NODE_ENV === 'production'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['PAYMENT_PROVIDER'],
        message:
          'PAYMENT_PROVIDER must be explicitly set to a real provider (e.g., "stripe") in production when payments are enabled',
      });
    }

    // If Stripe is the payment provider, webhook secret is required
    if (data.PAYMENT_PROVIDER === 'stripe' && !data.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['STRIPE_WEBHOOK_SECRET'],
        message: 'STRIPE_WEBHOOK_SECRET is required when PAYMENT_PROVIDER=stripe',
      });
    }

    // If ESIG is enabled in production, RSA keys are required
    if (
      data.NODE_ENV === 'production' &&
      data.NEXT_PUBLIC_FEATURE_ESIG === 'true' &&
      (!data.ESIG_RSA_PRIVATE_KEY || !data.ESIG_RSA_PUBLIC_KEY)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['ESIG_RSA_PRIVATE_KEY'],
        message:
          'ESIG_RSA_PRIVATE_KEY and ESIG_RSA_PUBLIC_KEY are required in production when ESIG is enabled. Generate with: openssl genrsa -out private.pem 2048',
      });
    }

    // In production, warn (but don't fail) if Upstash Redis is missing.
    // The rate limiter falls back to in-memory when Redis is absent.
    if (
      data.NODE_ENV === 'production' &&
      (!data.UPSTASH_REDIS_REST_URL || !data.UPSTASH_REDIS_REST_TOKEN)
    ) {
      console.warn(
        '⚠️  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting will use in-memory fallback',
      );
    }

    // If emails are enabled, Resend API key is required
    if (data.NEXT_PUBLIC_FEATURE_EMAILS === 'true' && !data.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when NEXT_PUBLIC_FEATURE_EMAILS=true',
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;

function validateEnv(): ServerEnv {
  // During Next.js build, runtime secrets (e.g. AUTH_SECRET) are not present.
  // Skip strict validation so the build succeeds; validation runs at server startup.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return process.env as unknown as ServerEnv;
  }

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    console.error('❌ Invalid environment variables:\n', formatted);
    throw new Error('Invalid environment variables. Check server logs for details.');
  }
  return result.data;
}

export const env = validateEnv();
