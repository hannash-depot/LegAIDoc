import { handlers } from '@/auth';
import { withRateLimit } from '@/lib/api/with-rate-limit';

export const GET = handlers.GET;

// AUTH-14: Rate limit login attempts — 5 per 15 minutes per IP
export const POST = withRateLimit(handlers.POST, {
  namespace: 'login',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});
