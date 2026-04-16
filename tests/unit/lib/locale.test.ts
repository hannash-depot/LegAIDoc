import { describe, it, expect } from 'vitest';
import { getDirection, isRTL, isValidLocale, locales, defaultLocale } from '@/lib/utils/locale';

describe('locale utilities', () => {
  it('defines exactly 4 locales', () => {
    expect(locales).toEqual(['he', 'ar', 'en', 'ru']);
  });

  it('defaults to Hebrew', () => {
    expect(defaultLocale).toBe('he');
  });

  describe('getDirection', () => {
    it('returns rtl for Hebrew', () => {
      expect(getDirection('he')).toBe('rtl');
    });

    it('returns rtl for Arabic', () => {
      expect(getDirection('ar')).toBe('rtl');
    });

    it('returns ltr for English', () => {
      expect(getDirection('en')).toBe('ltr');
    });

    it('returns ltr for Russian', () => {
      expect(getDirection('ru')).toBe('ltr');
    });

    it('returns ltr for unknown locales', () => {
      expect(getDirection('fr')).toBe('ltr');
    });
  });

  describe('isRTL', () => {
    it('returns true for he and ar', () => {
      expect(isRTL('he')).toBe(true);
      expect(isRTL('ar')).toBe(true);
    });

    it('returns false for en and ru', () => {
      expect(isRTL('en')).toBe(false);
      expect(isRTL('ru')).toBe(false);
    });
  });

  describe('isValidLocale', () => {
    it('returns true for valid locales', () => {
      expect(isValidLocale('he')).toBe(true);
      expect(isValidLocale('ar')).toBe(true);
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('ru')).toBe(true);
    });

    it('returns false for invalid locales', () => {
      expect(isValidLocale('fr')).toBe(false);
      expect(isValidLocale('')).toBe(false);
      expect(isValidLocale('hebrew')).toBe(false);
    });
  });
});
