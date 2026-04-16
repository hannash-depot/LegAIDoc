/**
 * PAYM-07/08: Invoice generator for Israeli Tax Invoice/Receipt.
 * Generates חשבונית מס קבלה (Tax Invoice Receipt) including ITA allocation number.
 */

import { formatIls } from './payment-service';
import { db } from '@/lib/db';
import { env } from '@/lib/env';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  customerName: string;
  customerVatNumber?: string;
  items: { description: string; amount: number }[];
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  itaAllocationNumber?: string;
  installments?: number;
}

/**
 * Generate sequential invoice number using database-backed atomic counter.
 * Israeli tax law requires gap-free sequential numbering that survives server restarts.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const result = await db.$queryRaw<[{ lastSeq: bigint }]>`
    INSERT INTO invoice_counters (year, "lastSeq") VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET "lastSeq" = invoice_counters."lastSeq" + 1
    RETURNING "lastSeq"
  `;

  const seq = String(Number(result[0].lastSeq)).padStart(6, '0');
  return `INV-${year}-${seq}`;
}

/**
 * PAYM-07/08: Render invoice as HTML for PDF generation.
 * Includes ITA Allocation Number (מספר הקצאה) and VAT details.
 */
export function renderInvoiceHtml(data: InvoiceData): string {
  const dateStr = new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data.issueDate);

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${formatIls(item.amount)}</td>
      </tr>`,
    )
    .join('');

  const businessName = env.BUSINESS_NAME;
  const businessVat = env.BUSINESS_VAT_NUMBER ?? '';
  const businessAddress = env.BUSINESS_ADDRESS ?? '';
  const businessPhone = env.BUSINESS_PHONE ?? '';
  const businessEmail = env.BUSINESS_EMAIL;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'David', 'Arial', sans-serif; margin: 40px; color: #1a1a1a; }
    .business-header { border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
    .business-name { font-size: 20px; font-weight: bold; }
    .business-details { font-size: 13px; color: #4b5563; margin-top: 4px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; }
    .invoice-num { color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px 8px; text-align: right; font-weight: 600; }
    .totals { margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .total-row.grand { font-weight: bold; font-size: 18px; border-top: 2px solid #1a1a1a; padding-top: 8px; }
    .allocation { margin-top: 30px; padding: 15px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
    .allocation-title { font-weight: bold; color: #0369a1; }
    .allocation-number { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
    .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="business-header">
    <div class="business-name">${businessName}</div>
    <div class="business-details">
      ${businessVat ? `ע.מ/ח.פ: ${businessVat}` : ''}
      ${businessAddress ? ` | ${businessAddress}` : ''}
      ${businessPhone ? ` | ${businessPhone}` : ''}
      ${businessEmail ? ` | ${businessEmail}` : ''}
    </div>
  </div>

  <div class="header">
    <div>
      <div class="title">חשבונית מס קבלה</div>
      <div class="invoice-num">מספר: ${data.invoiceNumber}</div>
    </div>
    <div>
      <div>תאריך: ${dateStr}</div>
      ${data.customerVatNumber ? `<div>ע.מ/ח.פ לקוח: ${data.customerVatNumber}</div>` : ''}
    </div>
  </div>

  <div><strong>לכבוד:</strong> ${data.customerName}</div>

  <table>
    <thead>
      <tr>
        <th>תיאור</th>
        <th style="text-align: left;">סכום</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>סכום לפני מע"מ:</span>
      <span>${formatIls(data.netAmount)}</span>
    </div>
    <div class="total-row">
      <span>מע"מ (17%):</span>
      <span>${formatIls(data.vatAmount)}</span>
    </div>
    <div class="total-row grand">
      <span>סה"כ לתשלום:</span>
      <span>${formatIls(data.grossAmount)}</span>
    </div>
    ${
      data.installments && data.installments > 1
        ? `
    <div class="total-row" style="color: #6b7280;">
      <span>תשלומים:</span>
      <span>
        ${data.installments - 1} × ${formatIls(Math.floor(data.grossAmount / data.installments))}
        + 1 × ${formatIls(data.grossAmount - Math.floor(data.grossAmount / data.installments) * (data.installments - 1))}
      </span>
    </div>`
        : ''
    }
  </div>

  ${
    data.itaAllocationNumber
      ? `
  <div class="allocation">
    <div class="allocation-title">מספר הקצאה</div>
    <div class="allocation-number">${data.itaAllocationNumber}</div>
  </div>`
      : ''
  }

  <div class="footer">
    <p>LegAIDoc — פלטפורמה חכמה למסמכים משפטיים</p>
    <p>מסמך זה הופק אוטומטית ואינו דורש חתימה.</p>
  </div>
</body>
</html>`;
}
