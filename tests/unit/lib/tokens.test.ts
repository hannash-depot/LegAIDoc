import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateToken, hashToken } from '@/lib/auth/tokens';

// Mock db for createVerificationToken / consumeVerificationToken
vi.mock('@/lib/db', () => ({
  db: {
    verificationToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { createVerificationToken, consumeVerificationToken } from '@/lib/auth/tokens';
import { db } from '@/lib/db';

describe('token utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateToken', () => {
    it('returns a token and its hash', () => {
      const { token, hashedToken } = generateToken();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(hashedToken).toHaveLength(64); // SHA-256 = 64 hex chars
      expect(token).not.toBe(hashedToken);
    });

    it('produces unique tokens each time', () => {
      const t1 = generateToken();
      const t2 = generateToken();
      expect(t1.token).not.toBe(t2.token);
    });
  });

  describe('hashToken', () => {
    it('produces consistent hashes', () => {
      const hash1 = hashToken('test-token');
      const hash2 = hashToken('test-token');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createVerificationToken', () => {
    it('creates token in database with correct identifier', async () => {
      const token = await createVerificationToken('test@example.com', 'pwd-reset', 3600000);

      expect(token).toHaveLength(64);
      expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'pwd-reset:test@example.com' },
      });
      expect(db.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: 'pwd-reset:test@example.com',
          token: expect.any(String),
          expires: expect.any(Date),
        }),
      });
    });
  });

  describe('consumeVerificationToken', () => {
    it('returns true and deletes token when valid', async () => {
      const { token, hashedToken } = generateToken();
      vi.mocked(db.verificationToken.findFirst).mockResolvedValue({
        identifier: 'pwd-reset:test@example.com',
        token: hashedToken,
        expires: new Date(Date.now() + 3600000),
      });

      const result = await consumeVerificationToken('test@example.com', 'pwd-reset', token);
      expect(result).toBe(true);
      expect(db.verificationToken.delete).toHaveBeenCalled();
    });

    it('returns false when no matching token found', async () => {
      vi.mocked(db.verificationToken.findFirst).mockResolvedValue(null);

      const result = await consumeVerificationToken('test@example.com', 'pwd-reset', 'bad-token');
      expect(result).toBe(false);
    });
  });
});
