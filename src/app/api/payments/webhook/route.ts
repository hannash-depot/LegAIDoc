/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { generateInvoiceNumber } from '@/lib/payments/invoice-generator';
import { constructStripeEvent } from '@/lib/payments/providers/stripe-provider';
import { renewSubscription } from '@/lib/payments/subscription-service';
import { FEATURE_EMAILS } from '@/lib/feature-flags';
import { notifyPaymentReceipt } from '@/lib/notifications';
import { sendPaymentReceipt } from '@/lib/email/send';
import { formatIls } from '@/lib/payments/payment-service';
import { logger } from '@/lib/logger';
import { LegacyWebhookSchema } from '@/schemas/payment-webhook';

export async function POST(request: NextRequest) {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  if (provider === 'stripe') {
    return handleStripeWebhook(request);
  }

  return handleLegacyWebhook(request);
}

// ============================================================
// Stripe webhook handler
// ============================================================

async function handleStripeWebhook(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return error('Missing stripe-signature header', 400, 'MISSING_SIGNATURE');
  }

  try {
    const event = constructStripeEvent(body, signature);

    // Idempotency: skip already-processed events
    const existing = await db.processedWebhookEvent.findUnique({ where: { id: event.id } });
    if (existing) {
      return success({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const documentId = session.metadata?.documentId;
        const userId = session.metadata?.userId;

        if (!documentId || !userId) break;

        // Update payment record
        const payment = await db.payment.findFirst({
          where: { gatewayRef: session.id },
        });

        if (payment && payment.status !== 'COMPLETED') {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              gatewayRef: (session.payment_intent as string) || session.id,
            },
          });

          // Mark document as published
          await db.document.update({
            where: { id: documentId },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
          });

          // Generate invoice
          const invoiceNumber = await generateInvoiceNumber();
          await db.invoice.create({
            data: {
              paymentId: payment.id,
              invoiceNumber,
              type: 'TAX_RECEIPT',
              amount: payment.amount,
              vatAmount: payment.vatAmount,
            },
          });

          // Send payment receipt email
          if (FEATURE_EMAILS) {
            try {
              const user = await db.user.findUnique({
                where: { id: userId },
                select: { email: true, preferredLocale: true },
              });
              const document = await db.document.findUnique({
                where: { id: documentId },
                select: { title: true, locale: true },
              });
              if (user?.email) {
                await sendPaymentReceipt({
                  to: user.email,
                  documentTitle: document?.title || 'Document',
                  amount: formatIls(payment.amount + payment.vatAmount),
                  invoiceNumber,
                  locale: document?.locale || user.preferredLocale || 'he',
                });
              }
            } catch (emailErr) {
              logger.error('Failed to send payment receipt email', emailErr, {
                paymentId: payment.id,
              });
            }
          }

          // Notify user about payment receipt
          notifyPaymentReceipt(
            userId,
            formatIls(payment.amount + payment.vatAmount),
            invoiceNumber,
          ).catch(() => {});

          await logAudit('payment.document_purchased', 'payment', payment.id, userId, {
            documentId,
            amount: payment.amount + payment.vatAmount,
          });
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const payment = await db.payment.findFirst({
          where: { gatewayRef: session.id, status: 'PENDING' },
        });

        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;
        if (!paymentIntentId) break;

        const payment = await db.payment.findFirst({
          where: { gatewayRef: paymentIntentId },
        });

        if (payment && payment.status === 'COMPLETED') {
          const isFullRefund = charge.amount_refunded === charge.amount;
          if (isFullRefund) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: 'REFUNDED' },
            });
          }

          await logAudit('webhook.charge_refunded', 'payment', payment.id, payment.userId, {
            amountRefunded: charge.amount_refunded,
            isFullRefund,
          });
        }
        break;
      }

      case 'invoice.paid': {
        // Handle Stripe subscription renewal payments
        const invoiceObj = event.data.object as Record<string, any>;
        const stripeSubId = invoiceObj.subscription as string;
        if (!stripeSubId || invoiceObj.billing_reason !== 'subscription_cycle') break;

        // Find our subscription by Stripe gateway reference
        const renewalPayment = await db.payment.findFirst({
          where: { gatewayRef: stripeSubId },
          include: { subscription: true },
        });

        if (renewalPayment?.subscription) {
          const { newEndDate } = await renewSubscription(renewalPayment.subscription.id);

          const netAmount = (invoiceObj.amount_paid as number) || 0;
          const vatAmount = Math.round(netAmount * 0.17);

          const payment = await db.payment.create({
            data: {
              userId: renewalPayment.userId,
              subscriptionId: renewalPayment.subscription.id,
              amount: netAmount,
              vatAmount,
              status: 'COMPLETED',
              gatewayRef: (invoiceObj.payment_intent as string) || invoiceObj.id,
            },
          });

          await db.invoice.create({
            data: {
              paymentId: payment.id,
              invoiceNumber: await generateInvoiceNumber(),
              type: 'TAX_RECEIPT',
              amount: netAmount,
              vatAmount,
            },
          });

          await logAudit(
            'webhook.subscription_renewed',
            'subscription',
            renewalPayment.subscription.id,
            renewalPayment.userId,
            {
              newEndDate: newEndDate.toISOString(),
              amount: netAmount + vatAmount,
            },
          );
        }
        break;
      }
    }

    // Mark event as processed
    await db.processedWebhookEvent.create({ data: { id: event.id } });

    return success({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error', err);
    return error('Webhook signature verification failed', 400, 'INVALID_SIGNATURE');
  }
}

// ============================================================
// Legacy (mock) webhook handler — kept for development
// ============================================================

async function handleLegacyWebhook(request: NextRequest) {
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return error('Webhook secret not configured', 500, 'SERVER_ERROR');
  }

  const providedSecret = request.headers.get('x-webhook-secret');
  if (
    !providedSecret ||
    providedSecret.length !== webhookSecret.length ||
    !timingSafeEqual(Buffer.from(providedSecret), Buffer.from(webhookSecret))
  ) {
    return error('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const rawBody = await request.json();
    const parsed = LegacyWebhookSchema.safeParse(rawBody);

    if (!parsed.success) {
      return error('Invalid webhook payload format', 400, 'INVALID_PAYLOAD');
    }

    const { event, data } = parsed.data;

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(data);
        break;
      default:
        logger.info(`Unhandled webhook event: ${event}`);
        break;
    }

    return success({ received: true });
  } catch (err) {
    logger.error('Webhook processing error', err);
    return error('Internal server error processing webhook', 500, 'WEBHOOK_ERROR');
  }
}

async function handlePaymentCaptured(data: any) {
  const paymentId = data.paymentId || data.gatewayRef;
  if (!paymentId) return;

  const payment = await db.payment.findFirst({
    where: {
      OR: [{ id: paymentId }, { gatewayRef: paymentId }],
    },
    select: {
      id: true,
      userId: true,
      status: true,
      amount: true,
      vatAmount: true,
      documentId: true,
      subscriptionId: true,
      gatewayRef: true,
      itaAllocationNumber: true,
      subscription: { select: { id: true, status: true } },
    },
  });

  if (!payment || payment.status === 'COMPLETED') return;

  await db.payment.update({
    where: { id: payment.id },
    data: { status: 'COMPLETED' },
  });

  // Mark document as published if this is a document payment
  if (payment.documentId) {
    await db.document.update({
      where: { id: payment.documentId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  const existingInvoice = await db.invoice.findFirst({ where: { paymentId: payment.id } });
  if (!existingInvoice) {
    const invoiceNumber = await generateInvoiceNumber();
    await db.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber,
        type: 'TAX_RECEIPT',
        amount: payment.amount,
        vatAmount: payment.vatAmount,
        itaAllocationNumber: payment.itaAllocationNumber,
      },
    });
  }

  // Send payment receipt email
  if (FEATURE_EMAILS) {
    try {
      const user = await db.user.findUnique({
        where: { id: payment.userId },
        select: { email: true, preferredLocale: true },
      });
      if (user?.email) {
        const invoice = await db.invoice.findFirst({
          where: { paymentId: payment.id },
          select: { invoiceNumber: true },
        });
        const document = payment.documentId
          ? await db.document.findUnique({
              where: { id: payment.documentId },
              select: { title: true, locale: true },
            })
          : null;
        await sendPaymentReceipt({
          to: user.email,
          documentTitle: document?.title || 'Subscription',
          amount: formatIls(payment.amount + payment.vatAmount),
          invoiceNumber: invoice?.invoiceNumber || '',
          locale: document?.locale || user.preferredLocale || 'he',
        });
      }
    } catch (emailErr) {
      logger.error('Failed to send payment receipt email', emailErr, { paymentId: payment.id });
    }
  }

  if (payment.subscriptionId && payment.subscription) {
    if (payment.subscription.status !== 'ACTIVE') {
      await db.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'ACTIVE' },
      });
    }
  }

  await logAudit('webhook.payment_captured', 'payment', payment.id, payment.userId, {
    gatewayRef: payment.gatewayRef,
    amount: payment.amount + payment.vatAmount,
  });
}

async function handlePaymentFailed(data: any) {
  const paymentId = data.paymentId || data.gatewayRef;
  if (!paymentId) return;

  const payment = await db.payment.findFirst({
    where: {
      OR: [{ id: paymentId }, { gatewayRef: paymentId }],
    },
  });

  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  });

  if (payment.subscriptionId) {
    await db.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'CANCELLED' },
    });
  }

  await logAudit('webhook.payment_failed', 'payment', payment.id, payment.userId, {
    reason: data.reason || 'Unknown gateway error',
  });
}

async function handleSubscriptionRenewed(data: Record<string, any>) {
  const { subscriptionId, gatewayRef, netAmount } = data;
  if (!subscriptionId) return;

  const subscription = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return;

  const endDate = new Date(subscription.endDate || new Date());
  endDate.setFullYear(endDate.getFullYear() + 1);

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { endDate, status: 'ACTIVE' },
  });

  const payment = await db.payment.create({
    data: {
      userId: subscription.userId,
      subscriptionId,
      amount: netAmount,
      vatAmount: Math.round(netAmount * 0.17),
      status: 'COMPLETED',
      gatewayRef,
    },
  });

  await db.invoice.create({
    data: {
      paymentId: payment.id,
      invoiceNumber: await generateInvoiceNumber(),
      type: 'TAX_RECEIPT',
      amount: payment.amount,
      vatAmount: payment.vatAmount,
    },
  });

  await logAudit(
    'webhook.subscription_renewed',
    'subscription',
    subscription.id,
    subscription.userId,
    {
      gatewayRef,
      amount: netAmount + payment.vatAmount,
    },
  );
}
