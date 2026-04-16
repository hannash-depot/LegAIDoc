import {
  GatewayChargeRequest,
  GatewayChargeResult,
  GatewayRefundRequest,
  GatewayRefundResult,
  PaymentProvider,
} from './payment-provider';

export class MockProvider implements PaymentProvider {
  getName(): string {
    return 'Mock';
  }

  /**
   * Simulated payment gateway charge.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async charge(_req: GatewayChargeRequest): Promise<GatewayChargeResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const gatewayRef = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return {
      success: true,
      gatewayRef,
    };
  }

  /**
   * Simulated payment gateway refund.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refund(_req: GatewayRefundRequest): Promise<GatewayRefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const refundRef = `MOCK-RF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return {
      success: true,
      refundRef,
    };
  }
}
