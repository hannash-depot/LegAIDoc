import { describe, it, expect } from 'vitest';
import {
  hashDocument,
  signDocumentHash,
  verifySignature,
  generateOtp,
  verifyOtp,
} from '@/lib/signatures/signature-service';

describe('signature service', () => {
  describe('hashDocument (ESIG-03)', () => {
    it('returns consistent SHA-256 hash', () => {
      const hash1 = hashDocument('Hello, World!');
      const hash2 = hashDocument('Hello, World!');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('produces different hashes for different content', () => {
      const hash1 = hashDocument('Document A');
      const hash2 = hashDocument('Document B');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('signDocumentHash / verifySignature (ESIG-03)', () => {
    it('signs and verifies a hash successfully', () => {
      const hash = hashDocument('Test document content');
      const signature = signDocumentHash(hash);
      const isValid = verifySignature(hash, signature);
      expect(isValid).toBe(true);
    });

    it('fails verification for tampered hash', () => {
      const hash = hashDocument('Original content');
      const signature = signDocumentHash(hash);
      const tamperedHash = hashDocument('Tampered content');
      const isValid = verifySignature(tamperedHash, signature);
      expect(isValid).toBe(false);
    });
  });

  describe('OTP generation and verification (ESIG-07)', () => {
    it('generates 6-digit OTP', () => {
      const { otp } = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('generates hash and expiry', () => {
      const { hash, expiresAt } = generateOtp();
      expect(hash).toHaveLength(64);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('verifies correct OTP', () => {
      const { otp, hash } = generateOtp();
      expect(verifyOtp(otp, hash)).toBe(true);
    });

    it('rejects incorrect OTP', () => {
      const { hash } = generateOtp();
      expect(verifyOtp('000000', hash)).toBe(false);
    });
  });
});
