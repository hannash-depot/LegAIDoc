/**
 * Feature flags read from environment variables.
 * All flags default to false (disabled) when not set.
 */

export const FEATURE_ESIG = process.env.NEXT_PUBLIC_FEATURE_ESIG === 'true';
export const FEATURE_PAYMENTS = process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true';
export const FEATURE_AI_IMPORT = process.env.NEXT_PUBLIC_FEATURE_AI_IMPORT === 'true';
export const FEATURE_EMAILS = process.env.NEXT_PUBLIC_FEATURE_EMAILS === 'true';
export const FEATURE_NOTIFICATIONS = process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === 'true';
