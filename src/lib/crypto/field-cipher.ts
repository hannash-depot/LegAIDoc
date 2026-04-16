import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = 'enc:';

function getKey(): Buffer {
  const hex = env.FIELD_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('FIELD_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a prefixed string: "enc:<iv>:<authTag>:<ciphertext>" (all base64).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX,
    iv.toString('base64'),
    ':',
    authTag.toString('base64'),
    ':',
    encrypted.toString('base64'),
  ].join('');
}

/**
 * Decrypts a string produced by `encrypt()`.
 */
export function decrypt(encrypted: string): string {
  if (!isEncrypted(encrypted)) {
    throw new Error('Value does not appear to be encrypted (missing prefix).');
  }

  const key = getKey();
  const payload = encrypted.slice(ENCRYPTED_PREFIX.length);
  const [ivB64, tagB64, cipherB64] = payload.split(':');

  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error('Malformed encrypted value.');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(cipherB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Checks whether a value was produced by `encrypt()`.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}
