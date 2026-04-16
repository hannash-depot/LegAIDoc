import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const LOCALES = ['he', 'ar', 'en', 'ru'] as const;
const MESSAGES_DIR = path.resolve(__dirname, '../../../messages');

/** Recursively extract all dot-notation keys from a nested object. */
function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadMessages(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('i18n message key consistency', () => {
  const messagesByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, loadMessages(locale)]),
  );

  const keysByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, new Set(getKeys(messagesByLocale[locale]))]),
  );

  // Build the union of all keys across all locales
  const allKeys = new Set<string>();
  for (const keys of Object.values(keysByLocale)) {
    for (const key of keys) allKeys.add(key);
  }

  it('all locale files have identical key sets', () => {
    const missingByLocale: Record<string, string[]> = {};

    for (const locale of LOCALES) {
      const missing = [...allKeys].filter((key) => !keysByLocale[locale].has(key));
      if (missing.length > 0) {
        missingByLocale[locale] = missing.sort();
      }
    }

    if (Object.keys(missingByLocale).length > 0) {
      const report = Object.entries(missingByLocale)
        .map(
          ([locale, keys]) =>
            `  ${locale}.json missing ${keys.length} keys:\n    ${keys.join('\n    ')}`,
        )
        .join('\n');
      expect.fail(`Locale files have mismatched keys:\n${report}`);
    }
  });

  it('no locale has empty string values', () => {
    const emptyByLocale: Record<string, string[]> = {};

    for (const locale of LOCALES) {
      const keys = getKeys(messagesByLocale[locale]);
      const empty = keys.filter((key) => {
        const parts = key.split('.');
        let val: unknown = messagesByLocale[locale];
        for (const part of parts) {
          val = (val as Record<string, unknown>)[part];
        }
        return val === '';
      });
      if (empty.length > 0) {
        emptyByLocale[locale] = empty.sort();
      }
    }

    if (Object.keys(emptyByLocale).length > 0) {
      const report = Object.entries(emptyByLocale)
        .map(
          ([locale, keys]) =>
            `  ${locale}.json has ${keys.length} empty values:\n    ${keys.join('\n    ')}`,
        )
        .join('\n');
      expect.fail(`Locale files have empty string values:\n${report}`);
    }
  });
});
