import { wrapEmailLayout } from './base-layout';

interface PaymentReceiptData {
  documentTitle: string;
  amount: string;
  invoiceNumber: string;
  locale: string;
}

const TEXTS: Record<
  string,
  {
    thanks: string;
    documentLabel: string;
    amountLabel: string;
    invoiceLabel: string;
    footer: string;
  }
> = {
  he: {
    thanks: 'תודה על הרכישה!',
    documentLabel: 'מסמך:',
    amountLabel: 'סכום:',
    invoiceLabel: 'מספר חשבונית:',
    footer: 'המסמך שלך זמין להורדה מחשבון LegAIDoc שלך.',
  },
  ar: {
    thanks: 'شكراً لك على الشراء!',
    documentLabel: 'المستند:',
    amountLabel: 'المبلغ:',
    invoiceLabel: 'رقم الفاتورة:',
    footer: 'المستند متاح للتنزيل من حسابك في LegAIDoc.',
  },
  en: {
    thanks: 'Thank you for your purchase!',
    documentLabel: 'Document:',
    amountLabel: 'Amount:',
    invoiceLabel: 'Invoice number:',
    footer: 'Your document is available for download from your LegAIDoc account.',
  },
  ru: {
    thanks: 'Спасибо за покупку!',
    documentLabel: 'Документ:',
    amountLabel: 'Сумма:',
    invoiceLabel: 'Номер счёта:',
    footer: 'Ваш документ доступен для скачивания в вашем аккаунте LegAIDoc.',
  },
};

export function paymentReceiptTemplate(data: PaymentReceiptData): string {
  const t = TEXTS[data.locale] || TEXTS.en;

  const content = `
      <p style="margin: 0 0 16px;">${t.thanks}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.documentLabel}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.documentTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.amountLabel}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px;">${t.invoiceLabel}</td>
          <td style="padding: 8px; font-weight: bold;">${data.invoiceNumber}</td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.footer}</p>
    `;

  return wrapEmailLayout(content, data.locale);
}
