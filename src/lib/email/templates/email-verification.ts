import { wrapEmailLayout } from './base-layout';

interface EmailVerificationData {
  verifyUrl: string;
  userName: string;
  locale: string;
}

const TEXTS: Record<
  string,
  { greeting: (name: string) => string; body: string; button: string; expiry: string }
> = {
  he: {
    greeting: (name) => `שלום ${name},`,
    body: 'תודה שנרשמת ל-LegAIDoc! לחץ/י על הכפתור למטה כדי לאמת את כתובת האימייל שלך:',
    button: 'אימות אימייל',
    expiry: 'קישור זה תקף ל-24 שעות.',
  },
  ar: {
    greeting: (name) => `مرحباً ${name}،`,
    body: 'شكراً لتسجيلك في LegAIDoc! انقر على الزر أدناه للتحقق من بريدك الإلكتروني:',
    button: 'التحقق من البريد الإلكتروني',
    expiry: 'هذا الرابط صالح لمدة 24 ساعة.',
  },
  en: {
    greeting: (name) => `Hi ${name},`,
    body: 'Thanks for signing up for LegAIDoc! Click the button below to verify your email address:',
    button: 'Verify Email',
    expiry: 'This link is valid for 24 hours.',
  },
  ru: {
    greeting: (name) => `Здравствуйте, ${name},`,
    body: 'Спасибо за регистрацию в LegAIDoc! Нажмите кнопку ниже, чтобы подтвердить ваш email:',
    button: 'Подтвердить email',
    expiry: 'Эта ссылка действительна в течение 24 часов.',
  },
};

export function emailVerificationTemplate(data: EmailVerificationData): string {
  const t = TEXTS[data.locale] || TEXTS.en;

  const content = `
      <p style="margin: 0 0 16px;">${t.greeting(data.userName)}</p>
      <p style="margin: 0 0 24px;">${t.body}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
        <tr>
          <td style="background-color: #1a56db; border-radius: 6px;">
            <a href="${data.verifyUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">${t.button}</a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.expiry}</p>
    `;

  return wrapEmailLayout(content, data.locale);
}
