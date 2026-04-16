import { wrapEmailLayout } from './base-layout';

interface SignatureRequestData {
  signatoryName: string;
  senderName: string;
  documentTitle: string;
  signingUrl: string;
  expiresAt: string; // formatted date
  locale: string;
}

const TEXTS: Record<
  string,
  {
    greeting: (name: string) => string;
    body: (sender: string, title: string) => string;
    action: string;
    expiry: (date: string) => string;
    warning: string;
    linkNote: string;
  }
> = {
  he: {
    greeting: (name) => `שלום ${name},`,
    body: (sender, title) => `${sender} מבקש/ת ממך לחתום על המסמך "${title}".`,
    action: 'חתום על המסמך',
    expiry: (date) => `קישור זה תקף עד ${date}.`,
    warning: 'אם אינך מכיר/ה את השולח, אנא התעלם/י מהודעה זו.',
    linkNote: 'אם הכפתור לא עובד, העתק/י את הקישור הבא לדפדפן:',
  },
  ar: {
    greeting: (name) => `مرحباً ${name}،`,
    body: (sender, title) => `${sender} يطلب منك التوقيع على المستند "${title}".`,
    action: 'توقيع المستند',
    expiry: (date) => `هذا الرابط صالح حتى ${date}.`,
    warning: 'إذا كنت لا تعرف المرسل، يرجى تجاهل هذه الرسالة.',
    linkNote: 'إذا لم يعمل الزر، انسخ الرابط التالي إلى المتصفح:',
  },
  en: {
    greeting: (name) => `Hi ${name},`,
    body: (sender, title) => `${sender} has requested your signature on the document "${title}".`,
    action: 'Sign Document',
    expiry: (date) => `This link expires on ${date}.`,
    warning: 'If you do not recognize the sender, please disregard this email.',
    linkNote: "If the button doesn't work, copy and paste this link into your browser:",
  },
  ru: {
    greeting: (name) => `Здравствуйте, ${name},`,
    body: (sender, title) => `${sender} запрашивает вашу подпись на документе "${title}".`,
    action: 'Подписать документ',
    expiry: (date) => `Ссылка действительна до ${date}.`,
    warning: 'Если вы не знаете отправителя, проигнорируйте это сообщение.',
    linkNote: 'Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:',
  },
};

export function signatureRequestTemplate(data: SignatureRequestData): string {
  const t = TEXTS[data.locale] || TEXTS.en;

  const content = `
    <p style="margin: 0 0 16px;">${t.greeting(data.signatoryName)}</p>
    <p style="margin: 0 0 24px;">${t.body(data.senderName, data.documentTitle)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
      <tr>
        <td style="background-color: #1a56db; border-radius: 8px; padding: 14px 32px; text-align: center;">
          <a href="${data.signingUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">${t.action}</a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">${t.expiry(data.expiresAt)}</p>
    <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">${t.warning}</p>
    <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">${t.linkNote}</p>
    <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">${data.signingUrl}</p>
  `;

  return wrapEmailLayout(content, data.locale);
}
