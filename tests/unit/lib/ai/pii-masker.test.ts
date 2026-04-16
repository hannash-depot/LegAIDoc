import { describe, it, expect } from 'vitest';
import { maskPii, unmaskPii } from '@/lib/ai/pii-masker';

describe('PII masker (AISP-07)', () => {
  it('masks Israeli ID numbers (9 digits)', () => {
    const text = 'ת.ז. 123456789 של השוכר';
    const { maskedText, tokenMap } = maskPii(text);
    expect(maskedText).not.toContain('123456789');
    expect(maskedText).toContain('<ID_TOKEN_');
    expect(tokenMap.size).toBe(1);
  });

  it('masks email addresses', () => {
    const text = 'שלח אל user@example.com';
    const { maskedText } = maskPii(text);
    expect(maskedText).not.toContain('user@example.com');
    expect(maskedText).toContain('<EMAIL_TOKEN_');
  });

  it('masks Israeli phone numbers', () => {
    const text = 'טלפון 054-1234567';
    const { maskedText } = maskPii(text);
    expect(maskedText).not.toContain('054-1234567');
    expect(maskedText).toContain('<PHONE_TOKEN_');
  });

  it('masks multiple PII types', () => {
    const text = 'ת.ז. 123456789, טל: 054-1234567, דוא"ל: test@test.com';
    const { maskedText, tokenMap } = maskPii(text);
    expect(tokenMap.size).toBe(3);
    expect(maskedText).not.toContain('123456789');
    expect(maskedText).not.toContain('054-1234567');
    expect(maskedText).not.toContain('test@test.com');
  });

  it('unmasks tokens back to original values', () => {
    const original = 'ת.ז. 123456789';
    const { maskedText, tokenMap } = maskPii(original);
    const restored = unmaskPii(maskedText, tokenMap);
    expect(restored).toBe(original);
  });

  it('handles text with no PII', () => {
    const text = 'הסכם שכירות סטנדרטי';
    const { maskedText, tokenMap } = maskPii(text);
    expect(maskedText).toBe(text);
    expect(tokenMap.size).toBe(0);
  });
});
