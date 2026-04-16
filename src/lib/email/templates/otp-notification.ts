import { wrapEmailLayout } from './base-layout';

interface OtpNotificationData {
  otp: string;
  documentTitle: string;
  signatoryName: string;
  locale: string;
}

const TEXTS: Record<
  string,
  {
    greeting: (name: string) => string;
    body: (title: string) => string;
    codeLabel: string;
    expiry: string;
    warning: string;
  }
> = {
  he: {
    greeting: (name) => `שלום ${name},`,
    body: (title) => `קוד האימות שלך לחתימה על המסמך "${title}":`,
    codeLabel: 'קוד אימות',
    expiry: 'קוד זה תקף ל-10 דקות.',
    warning: 'אם לא ביקשת לחתום על מסמך זה, אנא התעלם/י מהודעה זו.',
  },
  ar: {
    greeting: (name) => `مرحباً ${name}،`,
    body: (title) => `رمز التحقق الخاص بك لتوقيع المستند "${title}":`,
    codeLabel: 'رمز التحقق',
    expiry: 'هذا الرمز صالح لمدة 10 دقائق.',
    warning: 'إذا لم تطلب توقيع هذا المستند، يرجى تجاهل هذه الرسالة.',
  },
  en: {
    greeting: (name) => `Hi ${name},`,
    body: (title) => `Your verification code for signing the document "${title}":`,
    codeLabel: 'Verification Code',
    expiry: 'This code is valid for 10 minutes.',
    warning: 'If you did not request to sign this document, please ignore this email.',
  },
  ru: {
    greeting: (name) => `Здравствуйте, ${name},`,
    body: (title) => `Ваш код подтверждения для подписания документа "${title}":`,
    codeLabel: 'Код подтверждения',
    expiry: 'Этот код действителен в течение 10 минут.',
    warning: 'Если вы не запрашивали подписание этого документа, проигнорируйте это письмо.',
  },
};

export function otpNotificationTemplate(data: OtpNotificationData): string {
  const t = TEXTS[data.locale] || TEXTS.en;

  const content = `
      <p style="margin: 0 0 16px;">${t.greeting(data.signatoryName)}</p>
      <p style="margin: 0 0 24px;">${t.body(data.documentTitle)}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
        <tr>
          <td style="background-color: #f3f4f6; border-radius: 8px; padding: 16px 40px; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${t.codeLabel}</div>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a56db;">${data.otp}</div>
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">${t.expiry}</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.warning}</p>
    `;

  return wrapEmailLayout(content, data.locale);
}
