import { describe, it, expect } from 'vitest';
import { passwordResetTemplate } from '@/lib/email/templates/password-reset';
import { emailVerificationTemplate } from '@/lib/email/templates/email-verification';
import { otpNotificationTemplate } from '@/lib/email/templates/otp-notification';

describe('email templates', () => {
  const locales = ['he', 'ar', 'en', 'ru'];

  describe('passwordResetTemplate', () => {
    it.each(locales)('renders for locale %s', (locale) => {
      const html = passwordResetTemplate({
        resetUrl: 'https://example.com/reset?token=abc',
        userName: 'Test User',
        locale,
      });

      expect(html).toContain('LegAIDoc');
      expect(html).toContain('https://example.com/reset?token=abc');
      expect(html).toContain('Test User');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('sets RTL direction for Hebrew', () => {
      const html = passwordResetTemplate({
        resetUrl: 'https://example.com/reset',
        userName: 'User',
        locale: 'he',
      });
      expect(html).toContain('dir="rtl"');
    });

    it('sets LTR direction for English', () => {
      const html = passwordResetTemplate({
        resetUrl: 'https://example.com/reset',
        userName: 'User',
        locale: 'en',
      });
      expect(html).toContain('dir="ltr"');
    });
  });

  describe('emailVerificationTemplate', () => {
    it.each(locales)('renders for locale %s', (locale) => {
      const html = emailVerificationTemplate({
        verifyUrl: 'https://example.com/verify?token=xyz',
        userName: 'Test User',
        locale,
      });

      expect(html).toContain('LegAIDoc');
      expect(html).toContain('https://example.com/verify?token=xyz');
      expect(html).toContain('Test User');
    });
  });

  describe('otpNotificationTemplate', () => {
    it.each(locales)('renders for locale %s', (locale) => {
      const html = otpNotificationTemplate({
        otp: '123456',
        documentTitle: 'Rental Agreement',
        signatoryName: 'John',
        locale,
      });

      expect(html).toContain('LegAIDoc');
      expect(html).toContain('123456');
      expect(html).toContain('Rental Agreement');
      expect(html).toContain('John');
    });

    it('sets RTL for Arabic', () => {
      const html = otpNotificationTemplate({
        otp: '654321',
        documentTitle: 'عقد إيجار',
        signatoryName: 'أحمد',
        locale: 'ar',
      });
      expect(html).toContain('dir="rtl"');
    });
  });
});
