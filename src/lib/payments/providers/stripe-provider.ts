import Stripe from 'stripe';
import type {
  PaymentProvider,
  GatewayChargeRequest,
  GatewayChargeResult,
  GatewayRefundRequest,
  GatewayRefundResult,
} from './payment-provider';
import { env } from '@/lib/env';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export class StripeProvider implements PaymentProvider {
  getName(): string {
    return 'Stripe';
  }

  async charge(req: GatewayChargeRequest): Promise<GatewayChargeResult> {
    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: req.amount,
        currency: req.currency.toLowerCase(),
        receipt_email: req.customerEmail,
        description: req.description,
        automatic_payment_methods: { enabled: true },
      });

      return {
        success: true,
        gatewayRef: paymentIntent.id,
      };
    } catch (err) {
      return {
        success: false,
        gatewayRef: '',
        errorMessage: err instanceof Error ? err.message : 'Stripe charge failed',
      };
    }
  }

  async refund(req: GatewayRefundRequest): Promise<GatewayRefundResult> {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: req.gatewayRef,
        amount: req.amount,
        reason: 'requested_by_customer',
      });

      return {
        success: true,
        refundRef: refund.id,
      };
    } catch (err) {
      return {
        success: false,
        refundRef: '',
        errorMessage: err instanceof Error ? err.message : 'Stripe refund failed',
      };
    }
  }
}

/**
 * Creates a Stripe Checkout Session for pay-per-document.
 * Returns the checkout URL to redirect the user to.
 */
export async function createDocumentCheckoutSession(options: {
  documentId: string;
  documentTitle: string;
  priceAgorot: number;
  customerEmail: string;
  userId: string;
  locale: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: options.customerEmail,
    locale: 'auto',
    line_items: [
      {
        price_data: {
          currency: 'ils',
          unit_amount: options.priceAgorot,
          product_data: {
            name: options.documentTitle,
            description: 'LegAIDoc — Legal Document',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      documentId: options.documentId,
      userId: options.userId,
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Verifies a Stripe webhook signature and returns the event.
 */
export function constructStripeEvent(body: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return stripe.webhooks.constructEvent(body, signature, secret);
}
