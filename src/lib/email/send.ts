import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

const FROM_EMAIL = env.EMAIL_FROM;

/**
 * Send a transactional email.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info('Email sent', { to: options.to, subject: options.subject });
    return { success: true };
  } catch (err) {
    logger.error('Email send failed', err, { to: options.to, subject: options.subject });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}

/**
 * Send payment receipt email.
 */
export async function sendPaymentReceipt(options: {
  to: string;
  documentTitle: string;
  amount: string;
  invoiceNumber: string;
  locale: string;
}): Promise<{ success: boolean }> {
  const { paymentReceiptTemplate } = await import('./templates/payment-receipt');
  return sendEmail({
    to: options.to,
    subject: getPaymentReceiptSubject(options.locale),
    html: paymentReceiptTemplate({
      documentTitle: options.documentTitle,
      amount: options.amount,
      invoiceNumber: options.invoiceNumber,
      locale: options.locale,
    }),
  });
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
  userName: string;
  locale: string;
}): Promise<{ success: boolean }> {
  const { passwordResetTemplate } = await import('./templates/password-reset');
  return sendEmail({
    to: options.to,
    subject: getPasswordResetSubject(options.locale),
    html: passwordResetTemplate({
      resetUrl: options.resetUrl,
      userName: options.userName,
      locale: options.locale,
    }),
  });
}

/**
 * Send email verification email.
 */
export async function sendVerificationEmail(options: {
  to: string;
  verifyUrl: string;
  userName: string;
  locale: string;
}): Promise<{ success: boolean }> {
  const { emailVerificationTemplate } = await import('./templates/email-verification');
  return sendEmail({
    to: options.to,
    subject: getVerificationSubject(options.locale),
    html: emailVerificationTemplate({
      verifyUrl: options.verifyUrl,
      userName: options.userName,
      locale: options.locale,
    }),
  });
}

/**
 * Send OTP email for electronic signatures.
 */
export async function sendOtpEmail(options: {
  to: string;
  otp: string;
  documentTitle: string;
  signatoryName: string;
  locale: string;
}): Promise<{ success: boolean }> {
  const { otpNotificationTemplate } = await import('./templates/otp-notification');
  return sendEmail({
    to: options.to,
    subject: getOtpSubject(options.locale),
    html: otpNotificationTemplate({
      otp: options.otp,
      documentTitle: options.documentTitle,
      signatoryName: options.signatoryName,
      locale: options.locale,
    }),
  });
}

/**
 * ESIG-11: Send signature request email with signing link.
 */
export async function sendSignatureRequestEmail(options: {
  to: string;
  signatoryName: string;
  senderName: string;
  documentTitle: string;
  signingUrl: string;
  expiresAt: string;
  locale: string;
}): Promise<{ success: boolean }> {
  const { signatureRequestTemplate } = await import('./templates/signature-request');
  return sendEmail({
    to: options.to,
    subject: getSignatureRequestSubject(options.locale),
    html: signatureRequestTemplate({
      signatoryName: options.signatoryName,
      senderName: options.senderName,
      documentTitle: options.documentTitle,
      signingUrl: options.signingUrl,
      expiresAt: options.expiresAt,
      locale: options.locale,
    }),
  });
}

// Localized email subjects
function getPasswordResetSubject(locale: string): string {
  const subjects: Record<string, string> = {
    he: 'LegAIDoc — איפוס סיסמה',
    ar: 'LegAIDoc — إعادة تعيين كلمة المرور',
    en: 'LegAIDoc — Password Reset',
    ru: 'LegAIDoc — Сброс пароля',
  };
  return subjects[locale] || subjects.en;
}

function getVerificationSubject(locale: string): string {
  const subjects: Record<string, string> = {
    he: 'LegAIDoc — אימות כתובת אימייל',
    ar: 'LegAIDoc — التحقق من البريد الإلكتروني',
    en: 'LegAIDoc — Verify Your Email',
    ru: 'LegAIDoc — Подтверждение email',
  };
  return subjects[locale] || subjects.en;
}

function getPaymentReceiptSubject(locale: string): string {
  const subjects: Record<string, string> = {
    he: 'LegAIDoc — קבלה על תשלום',
    ar: 'LegAIDoc — إيصال الدفع',
    en: 'LegAIDoc — Payment Receipt',
    ru: 'LegAIDoc — Квитанция об оплате',
  };
  return subjects[locale] || subjects.en;
}

function getOtpSubject(locale: string): string {
  const subjects: Record<string, string> = {
    he: 'LegAIDoc — קוד אימות לחתימה',
    ar: 'LegAIDoc — رمز التحقق للتوقيع',
    en: 'LegAIDoc — Signing Verification Code',
    ru: 'LegAIDoc — Код подтверждения подписи',
  };
  return subjects[locale] || subjects.en;
}

function getSignatureRequestSubject(locale: string): string {
  const subjects: Record<string, string> = {
    he: 'LegAIDoc — נדרשת חתימתך על מסמך',
    ar: 'LegAIDoc — مطلوب توقيعك على مستند',
    en: 'LegAIDoc — Your Signature is Requested',
    ru: 'LegAIDoc — Требуется ваша подпись на документе',
  };
  return subjects[locale] || subjects.en;
}
