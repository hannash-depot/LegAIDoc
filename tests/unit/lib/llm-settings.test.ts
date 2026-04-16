import { describe, it, expect } from 'vitest';
import { maskApiKey } from '@/lib/settings/llm-settings';

describe('LLM Settings Logic', () => {
  describe('maskApiKey', () => {
    it('should return empty string for empty input', () => {
      expect(maskApiKey('')).toBe('');
    });

    it('should return asterisks for short keys', () => {
      expect(maskApiKey('123')).toBe('****');
    });

    it('should mask middle characters for long keys', () => {
      expect(maskApiKey('sk-ant-1234567890abcdef')).toBe('sk-a...bcdef');
    });
  });
});
