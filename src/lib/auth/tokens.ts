import { randomBytes, createHash } from 'node:crypto';
import { db } from '@/lib/db';

/**
 * Generate a cryptographic token and its SHA-256 hash.
 */
export function generateToken(): { token: string; hashedToken: string } {
  const token = randomBytes(32).toString('hex');
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

/**
 * Hash a token with SHA-256.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type TokenType = 'pwd-reset' | 'email-verify';

/**
 * Create a verification token and store it in the database.
 * Returns the raw (unhashed) token to include in the email link.
 */
export async function createVerificationToken(
  email: string,
  type: TokenType,
  expiresInMs: number,
): Promise<string> {
  const identifier = `${type}:${email}`;
  const { token, hashedToken } = generateToken();
  const expires = new Date(Date.now() + expiresInMs);

  // Delete any existing tokens for this identifier
  await db.verificationToken.deleteMany({
    where: { identifier },
  });

  await db.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  return token;
}

/**
 * Verify and consume a token. Returns true if valid, false otherwise.
 * The token is deleted after successful verification (single-use).
 */
export async function consumeVerificationToken(
  email: string,
  type: TokenType,
  token: string,
): Promise<boolean> {
  const identifier = `${type}:${email}`;
  const hashedToken = hashToken(token);

  const record = await db.verificationToken.findFirst({
    where: {
      identifier,
      token: hashedToken,
      expires: { gt: new Date() },
    },
  });

  if (!record) return false;

  // Delete the token (single-use)
  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: record.identifier,
        token: record.token,
      },
    },
  });

  return true;
}
