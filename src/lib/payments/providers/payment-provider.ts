export interface PaymentProvider {
  /**
   * Charge the user for a specific amount.
   */
  charge(req: GatewayChargeRequest): Promise<GatewayChargeResult>;

  /**
   * Refund a previous charge (full or partial).
   */
  refund(req: GatewayRefundRequest): Promise<GatewayRefundResult>;

  /**
   * Get the name of this provider.
   */
  getName(): string;
}

export interface GatewayChargeRequest {
  amount: number; // agorot
  currency: 'ILS';
  installments: number;
  customerEmail: string;
  description: string;
}

export interface GatewayChargeResult {
  success: boolean;
  gatewayRef: string;
  errorMessage?: string;
}

export interface GatewayRefundRequest {
  gatewayRef: string; // original payment gateway reference
  amount: number; // agorot — amount to refund
  reason?: string;
}

export interface GatewayRefundResult {
  success: boolean;
  refundRef: string; // gateway refund reference
  errorMessage?: string;
}
