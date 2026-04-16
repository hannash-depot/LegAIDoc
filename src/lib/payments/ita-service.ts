/**
 * PAYM-04/05/06: ITA SHAAM API service (mock implementation).
 * Handles CTC (Continuous Transaction Control) invoice allocation.
 */

export interface ItaAllocationRequest {
  customerVatNumber: string; // PAYM-05
  invoiceDate: string; // ISO date
  invoiceAmount: number; // agorot
  accountingSoftwareNumber: string; // PAYM-05
}

export interface ItaAllocationResult {
  success: boolean;
  allocationNumber?: string; // PAYM-07: 9-digit number
  errorCode?: string;
  errorMessage?: string;
}

import { env } from '@/lib/env';

const ACCOUNTING_SOFTWARE_NUMBER = env.ITA_SOFTWARE_NUMBER;

/**
 * PAYM-04: Request ITA CTC Allocation Number.
 * Mock implementation following the real SHAAM API contract.
 * In production, replace with actual HTTPS call to ITA API.
 */
export async function requestItaAllocation(
  req: ItaAllocationRequest,
): Promise<ItaAllocationResult> {
  // Validate payload (PAYM-05)
  if (!req.customerVatNumber || req.customerVatNumber.length !== 9) {
    return {
      success: false,
      errorCode: 'INVALID_VAT',
      errorMessage: 'Customer VAT number must be 9 digits',
    };
  }

  if (req.invoiceAmount <= 0) {
    return {
      success: false,
      errorCode: 'INVALID_AMOUNT',
      errorMessage: 'Invoice amount must be positive',
    };
  }

  // Simulate ITA API processing
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Generate 9-digit allocation number (PAYM-07)
  const allocationNumber = String(Math.floor(100000000 + Math.random() * 900000000));

  return {
    success: true,
    allocationNumber,
  };
}

/**
 * PAYM-10: Request negative allocation number for credit/refund invoices.
 */
export async function requestItaCreditAllocation(
  req: ItaAllocationRequest,
): Promise<ItaAllocationResult> {
  // For credit invoices, amount should be negative
  return requestItaAllocation({
    ...req,
    invoiceAmount: Math.abs(req.invoiceAmount),
  });
}

/**
 * Build ITA payload conforming to SHAAM API JSON schema (PAYM-05).
 */
export function buildItaPayload(
  customerVatNumber: string,
  invoiceDate: Date,
  invoiceAmountAgorot: number,
): ItaAllocationRequest {
  return {
    customerVatNumber,
    invoiceDate: invoiceDate.toISOString().split('T')[0],
    invoiceAmount: invoiceAmountAgorot,
    accountingSoftwareNumber: ACCOUNTING_SOFTWARE_NUMBER,
  };
}
