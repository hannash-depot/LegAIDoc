import { db } from '@/lib/db';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto/field-cipher';

export interface LlmSettingData {
  provider: string;
  apiKey: string;
  isActive: boolean;
}

/**
 * Get LLM setting for a specific provider.
 * API key is decrypted before returning.
 */
export async function getLlmSetting(provider: string) {
  const setting = await db.llmSetting.findUnique({
    where: { provider },
  });

  if (setting && setting.apiKey) {
    setting.apiKey = isEncrypted(setting.apiKey) ? decrypt(setting.apiKey) : setting.apiKey;
  }

  return setting;
}

/**
 * Get all active LLM settings.
 * API keys are decrypted before returning.
 */
export async function getAllLlmSettings() {
  const settings = await db.llmSetting.findMany({
    where: { isActive: true },
  });

  return settings.map((s) => ({
    ...s,
    apiKey: s.apiKey && isEncrypted(s.apiKey) ? decrypt(s.apiKey) : s.apiKey,
  }));
}

/**
 * Update or create LLM setting for a provider.
 * API key is encrypted before storing.
 */
export async function updateLlmSetting(data: LlmSettingData) {
  const { provider, apiKey, isActive } = data;
  const encryptedKey = apiKey ? encrypt(apiKey) : apiKey;

  return db.llmSetting.upsert({
    where: { provider },
    update: {
      apiKey: encryptedKey,
      isActive,
    },
    create: {
      provider,
      apiKey: encryptedKey,
      isActive,
    },
  });
}

/**
 * Migrate existing unencrypted API keys to encrypted format.
 * Safe to run multiple times — skips already-encrypted values.
 */
export async function migrateExistingKeys() {
  const settings = await db.llmSetting.findMany();

  for (const setting of settings) {
    if (setting.apiKey && !isEncrypted(setting.apiKey)) {
      await db.llmSetting.update({
        where: { provider: setting.provider },
        data: { apiKey: encrypt(setting.apiKey) },
      });
    }
  }
}

/**
 * Get masked API key for UI display.
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 5)}`;
}
