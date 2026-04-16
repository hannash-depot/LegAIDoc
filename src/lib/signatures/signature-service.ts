import { createHash, createSign, createVerify, generateKeyPairSync } from 'crypto';

/**
 * ESIG: Digital signature service.
 *
 * In production, RSA keys MUST be provided via environment variables
 * (ESIG_RSA_PRIVATE_KEY and ESIG_RSA_PUBLIC_KEY) so that signatures
 * persist across deployments and serverless cold starts.
 *
 * In development, a local key pair is auto-generated if env vars are absent.
 * See ESIG-10 for future HSM/KMS integration.
 */

let _keyPair: { publicKey: string; privateKey: string } | null = null;

function getKeyPair() {
  if (!_keyPair) {
    const envPrivate = process.env.ESIG_RSA_PRIVATE_KEY;
    const envPublic = process.env.ESIG_RSA_PUBLIC_KEY;

    if (envPrivate && envPublic) {
      // Production: use persistent keys from environment
      _keyPair = {
        privateKey: envPrivate.replace(/\\n/g, '\n'),
        publicKey: envPublic.replace(/\\n/g, '\n'),
      };
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ESIG_RSA_PRIVATE_KEY and ESIG_RSA_PUBLIC_KEY are required in production when ESIG is enabled. ' +
          'Generate with: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem',
      );
    } else {
      // Development: auto-generate ephemeral keys
      const pair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      _keyPair = pair;
    }
  }
  return _keyPair;
}

/**
 * ESIG-03: Generate SHA-256 hash of document content.
 */
export function hashDocument(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * ESIG-03: Sign a document hash with the platform private key.
 * Returns base64-encoded signature.
 */
export function signDocumentHash(hash: string): string {
  const { privateKey } = getKeyPair();
  const signer = createSign('SHA256');
  signer.update(hash);
  return signer.sign(privateKey, 'base64');
}

/**
 * ESIG-03: Verify a signature against a document hash.
 */
export function verifySignature(hash: string, signature: string): boolean {
  const { publicKey } = getKeyPair();
  const verifier = createVerify('SHA256');
  verifier.update(hash);
  return verifier.verify(publicKey, signature, 'base64');
}

/**
 * ESIG-04: Generate timestamp for signing.
 * In production, this would call a TSA (Time Stamping Authority).
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * ESIG-07: Generate a 6-digit OTP for signatory email verification.
 */
export function generateOtp(): { otp: string; hash: string; expiresAt: Date } {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hash = createHash('sha256').update(otp).digest('hex');
  const expiryMinutes = parseInt(process.env.ESIG_OTP_EXPIRY_MINUTES || '15', 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return { otp, hash, expiresAt };
}

/**
 * ESIG-07: Verify OTP against stored hash.
 */
export function verifyOtp(otp: string, storedHash: string): boolean {
  const hash = createHash('sha256').update(otp).digest('hex');
  return hash === storedHash;
}

/**
 * Get the public key for certificate inclusion.
 */
export function getPublicKey(): string {
  return getKeyPair().publicKey;
}
