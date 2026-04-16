import { wrapEmailLayout } from './base-layout';

interface PasswordResetData {
  resetUrl: string;
  userName: string;
  locale: string;
}

const TEXTS: Record<
  string,
  {
    greeting: (name: string) => string;
    body: string;
    button: string;
    expiry: string;
    ignore: string;
  }
> = {
  he: {
    greeting: (name) => `שלום ${name},`,
    body: 'קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ/י על הכפתור למטה כדי לבחור סיסמה חדשה:',
    button: 'איפוס סיסמה',
    expiry: 'קישור זה תקף לשעה אחת בלבד.',
    ignore: 'אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו.',
  },
  ar: {
    greeting: (name) => `مرحباً ${name}،`,
    body: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لاختيار كلمة مرور جديدة:',
    button: 'إعادة تعيين كلمة المرور',
    expiry: 'هذا الرابط صالح لمدة ساعة واحدة فقط.',
    ignore: 'إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.',
  },
  en: {
    greeting: (name) => `Hi ${name},`,
    body: 'We received a request to reset your password. Click the button below to choose a new password:',
    button: 'Reset Password',
    expiry: 'This link is valid for 1 hour only.',
    ignore: 'If you did not request a password reset, you can safely ignore this email.',
  },
  ru: {
    greeting: (name) => `Здравствуйте, ${name},`,
    body: 'Мы получили запрос на сброс вашего пароля. Нажмите кнопку ниже, чтобы выбрать новый пароль:',
    button: 'Сбросить пароль',
    expiry: 'Эта ссылка действительна в течение 1 часа.',
    ignore: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.',
  },
};

export function passwordResetTemplate(data: PasswordResetData): string {
  const t = TEXTS[data.locale] || TEXTS.en;

  const content = `
      <p style="margin: 0 0 16px;">${t.greeting(data.userName)}</p>
      <p style="margin: 0 0 24px;">${t.body}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
        <tr>
          <td style="background-color: #1a56db; border-radius: 6px;">
            <a href="${data.resetUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">${t.button}</a>
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">${t.expiry}</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.ignore}</p>
    `;

  return wrapEmailLayout(content, data.locale);
}
