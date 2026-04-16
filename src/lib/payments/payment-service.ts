/**
 * PAYM — Payment service for Israeli payment processing.
 * Handles VAT calculation, installment (Tashlumim) logic, and simulated gateway.
 */

const VAT_RATE = 0.17; // PAYM-09: Israeli VAT at 17%
const MIN_INSTALLMENT_AMOUNT = 50000; // 500 NIS in agorot — PAYM-02
const MAX_INSTALLMENTS = 12;

/**
 * Calculate VAT for a given amount in agorot.
 * Returns gross, net, and vat amounts, all in agorot.
 */
export function calculateVat(netAmountAgorot: number): {
  net: number;
  vat: number;
  gross: number;
} {
  const vat = Math.round(netAmountAgorot * VAT_RATE);
  return {
    net: netAmountAgorot,
    vat,
    gross: netAmountAgorot + vat,
  };
}

/**
 * PAYM-02: Calculate available installment options for Tashlumim.
 * Only available for amounts > 500 NIS.
 */
export function getInstallmentOptions(grossAmountAgorot: number): number[] {
  if (grossAmountAgorot < MIN_INSTALLMENT_AMOUNT) {
    return [1]; // No installments for small amounts
  }

  const options: number[] = [];
  for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
    const perInstallment = Math.ceil(grossAmountAgorot / i);
    if (perInstallment >= 1000) {
      // Minimum 10 NIS per installment
      options.push(i);
    }
  }
  return options;
}

/**
 * Format amount from agorot to NIS display string.
 */
export function formatIls(agorot: number): string {
  return `₪${(agorot / 100).toFixed(2)}`;
}

// ============================================================
// Payment Gateway Configuration (PAYM-01)
// ============================================================

import {
  PaymentProvider,
  GatewayChargeRequest,
  GatewayChargeResult,
  GatewayRefundRequest,
  GatewayRefundResult,
} from './providers/payment-provider';
import { MockProvider } from './providers/mock-provider';
import { StripeProvider } from './providers/stripe-provider';
// Factory function to get the configured payment provider
export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER || 'mock';

  switch (providerName.toLowerCase()) {
    case 'mock':
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'MockProvider cannot be used in production. Set PAYMENT_PROVIDER to a real provider (e.g., "stripe").',
        );
      }
      return new MockProvider();
    case 'stripe':
      return new StripeProvider();
    default:
      throw new Error(`Unknown payment provider: "${providerName}". Supported: "stripe".`);
  }
}

/**
 * Charge via the configured payment gateway.
 */
export async function chargePaymentGateway(
  req: GatewayChargeRequest,
): Promise<GatewayChargeResult> {
  const provider = getPaymentProvider();
  return provider.charge(req);
}

/**
 * Refund via the configured payment gateway.
 */
export async function refundPaymentGateway(
  req: GatewayRefundRequest,
): Promise<GatewayRefundResult> {
  const provider = getPaymentProvider();
  return provider.refund(req);
}
