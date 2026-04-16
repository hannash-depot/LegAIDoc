import { TOTP, Secret } from 'otpauth';
import * as QRCode from 'qrcode';

const ISSUER = 'LegAIDoc';
const PERIOD = 30;
const DIGITS = 6;
const ALGORITHM = 'SHA1';

/**
 * PRIV-02: Generate a new TOTP secret for MFA setup.
 */
export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Create TOTP instance from a base32 secret.
 */
function createTotp(secret: string, email: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: Secret.fromBase32(secret),
  });
}

/**
 * Generate the otpauth:// URI for QR code scanning.
 */
export function getTotpUri(secret: string, email: string): string {
  const totp = createTotp(secret, email);
  return totp.toString();
}

/**
 * Generate a QR code as data URL (base64 PNG) for the TOTP URI.
 */
export async function generateQrCodeDataUrl(secret: string, email: string): Promise<string> {
  const uri = getTotpUri(secret, email);
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/**
 * Verify a TOTP token against a secret.
 * Allows 1 period of drift in either direction.
 */
export function verifyTotpToken(secret: string, token: string, email: string): boolean {
  const totp = createTotp(secret, email);
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
