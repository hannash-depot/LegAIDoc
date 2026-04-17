import { z } from 'zod/v4';

/**
 * Legacy/mock payment webhook envelope. Stripe webhooks are validated via
 * Stripe's signature verification in `constructStripeEvent`, so this schema
 * only applies to the fallback mock provider.
 */
export const LegacyWebhookSchema = z.object({
  event: z.enum(['payment.captured', 'payment.failed', 'subscription.renewed']),
  data: z.record(z.string(), z.unknown()),
});

export type LegacyWebhookInput = z.infer<typeof LegacyWebhookSchema>;
