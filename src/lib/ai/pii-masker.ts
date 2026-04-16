/**
 * AISP-07: PII masker for anonymizing sensitive data before LLM dispatch.
 * Replaces Israeli ID numbers, phone numbers, emails, and addresses with tokens.
 */

interface MaskResult {
  maskedText: string;
  tokenMap: Map<string, string>;
}

// Israeli ID number: 9 digits
const IL_ID_REGEX = /\b\d{9}\b/g;

// Israeli phone: +972, 05x, 02/03/04/08/09 patterns
const IL_PHONE_REGEX =
  /(?:\+972|0)[\s-]?(?:[2-9]\d[\s-]?\d{3}[\s-]?\d{4}|5\d[\s-]?\d{3}[\s-]?\d{4})/g;

// Email
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Israeli street address patterns (Hebrew with number)
const IL_ADDRESS_REGEX =
  /(?:רח(?:וב)?['\u0027]?\s+[\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*\s+\d+)/g;

// Credit card (basic 16 digit pattern)
const CC_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

let tokenCounter = 0;

function generateToken(type: string): string {
  tokenCounter++;
  return `<${type}_${tokenCounter}>`;
}

/**
 * Mask PII in text, returning the masked text and a reverse-map of tokens → original values.
 */
export function maskPii(text: string): MaskResult {
  tokenCounter = 0;
  const tokenMap = new Map<string, string>();
  let maskedText = text;

  // Order matters: more specific patterns first

  // Credit cards
  maskedText = maskedText.replace(CC_REGEX, (match) => {
    const token = generateToken('CC_TOKEN');
    tokenMap.set(token, match);
    return token;
  });

  // Emails
  maskedText = maskedText.replace(EMAIL_REGEX, (match) => {
    const token = generateToken('EMAIL_TOKEN');
    tokenMap.set(token, match);
    return token;
  });

  // Phone numbers (before ID to avoid conflicts)
  maskedText = maskedText.replace(IL_PHONE_REGEX, (match) => {
    const token = generateToken('PHONE_TOKEN');
    tokenMap.set(token, match);
    return token;
  });

  // Israeli IDs
  maskedText = maskedText.replace(IL_ID_REGEX, (match) => {
    const token = generateToken('ID_TOKEN');
    tokenMap.set(token, match);
    return token;
  });

  // Addresses
  maskedText = maskedText.replace(IL_ADDRESS_REGEX, (match) => {
    const token = generateToken('ADDRESS_TOKEN');
    tokenMap.set(token, match);
    return token;
  });

  return { maskedText, tokenMap };
}

/**
 * Unmask tokens back to original values.
 */
export function unmaskPii(text: string, tokenMap: Map<string, string>): string {
  let result = text;
  for (const [token, original] of tokenMap) {
    result = result.replace(token, original);
  }
  return result;
}
