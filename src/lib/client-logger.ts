/**
 * Client-side logger for browser environments.
 * Sends structured logs to console in development and could be extended
 * to send to a log aggregation service in production.
 */
export const clientLogger = {
  error(message: string, error?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[LegAIDoc] ${message}`, error ?? '');
    }
    // In production, errors are captured by Sentry's global error handler
  },

  warn(message: string, context?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[LegAIDoc] ${message}`, context ?? '');
    }
  },
};
