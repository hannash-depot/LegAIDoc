import * as Sentry from '@sentry/nextjs';

const hasConsent =
  typeof window !== 'undefined' && localStorage.getItem('legaidoc-cookie-consent') === 'accepted';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Performance tracing and replays require cookie consent
  tracesSampleRate: hasConsent ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0) : 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: hasConsent ? (process.env.NODE_ENV === 'production' ? 1.0 : 0) : 0,
  debug: false,
});
