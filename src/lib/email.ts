import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "LegAIDoc <noreply@legaidoc.com>";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  locale: string
) {
  const subjects: Record<string, string> = {
    he: "איפוס סיסמה - LegAIDoc",
    ar: "إعادة تعيين كلمة المرور - LegAIDoc",
    en: "Password Reset - LegAIDoc",
    ru: "Сброс пароля - LegAIDoc",
  };

  const bodies: Record<string, string> = {
    he: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">איפוס סיסמה</h2>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          איפוס סיסמה
        </a>
        <p style="color: #666; font-size: 14px;">הקישור תקף ל-60 דקות. אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.</p>
      </div>
    `,
    ar: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">إعادة تعيين كلمة المرور</h2>
        <p>تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لاختيار كلمة مرور جديدة:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          إعادة تعيين كلمة المرور
        </a>
        <p style="color: #666; font-size: 14px;">الرابط صالح لمدة 60 دقيقة. إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.</p>
      </div>
    `,
    en: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Password Reset</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link is valid for 60 minutes. If you didn't request a password reset, ignore this email.</p>
      </div>
    `,
    ru: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Сброс пароля</h2>
        <p>Мы получили запрос на сброс вашего пароля. Нажмите на кнопку ниже, чтобы выбрать новый пароль:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Сбросить пароль
        </a>
        <p style="color: #666; font-size: 14px;">Ссылка действительна 60 минут. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
      </div>
    `,
  };

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: subjects[locale] || subjects.en,
    html: bodies[locale] || bodies.en,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send email");
  }
}
