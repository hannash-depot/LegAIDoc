import { describe, it, expect } from 'vitest';
import { compileV2toV1, ensureV1 } from '@/lib/templates/compiler';
import type {
  TemplateDefinitionV1Type,
  TemplateDefinitionV2Type,
} from '@/schemas/template-definition';

const localized = (text: string) => ({ he: text, ar: text, en: text, ru: text });

const sampleStep = {
  key: 'basics',
  title: localized('Basics'),
  fields: [
    {
      key: 'name',
      type: 'text' as const,
      label: localized('Name'),
      required: true,
      width: 'full' as const,
    },
  ],
};

describe('template compiler (TDEF-10)', () => {
  describe('compileV2toV1', () => {
    it('compiles a single section into documentBody', () => {
      const v2: TemplateDefinitionV2Type = {
        version: 2,
        steps: [sampleStep],
        sections: [
          {
            title: localized('Introduction'),
            body: localized('This is the intro.'),
            sortOrder: 0,
            parameters: [],
          },
        ],
      };

      const v1 = compileV2toV1(v2);

      expect(v1.version).toBe(1);
      expect(v1.steps).toBe(v2.steps);
      expect(v1.documentBody.en).toContain('<h2>1. Introduction</h2>');
      expect(v1.documentBody.en).toContain('This is the intro.');
    });

    it('sorts sections by sortOrder', () => {
      const v2: TemplateDefinitionV2Type = {
        version: 2,
        steps: [sampleStep],
        sections: [
          { title: localized('Second'), body: localized('B'), sortOrder: 2, parameters: [] },
          { title: localized('First'), body: localized('A'), sortOrder: 1, parameters: [] },
          { title: localized('Third'), body: localized('C'), sortOrder: 3, parameters: [] },
        ],
      };

      const v1 = compileV2toV1(v2);

      const body = v1.documentBody.en;
      const firstIdx = body.indexOf('1. First');
      const secondIdx = body.indexOf('2. Second');
      const thirdIdx = body.indexOf('3. Third');

      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });

    it('generates bilingual content for all 4 locales', () => {
      const v2: TemplateDefinitionV2Type = {
        version: 2,
        steps: [sampleStep],
        sections: [
          {
            title: { he: 'כותרת', ar: 'عنوان', en: 'Title', ru: 'Заголовок' },
            body: { he: 'תוכן', ar: 'محتوى', en: 'Content', ru: 'Содержание' },
            sortOrder: 0,
            parameters: [],
          },
        ],
      };

      const v1 = compileV2toV1(v2);

      expect(v1.documentBody.he).toContain('כותרת');
      expect(v1.documentBody.ar).toContain('عنوان');
      expect(v1.documentBody.en).toContain('Title');
      expect(v1.documentBody.ru).toContain('Заголовок');
    });
  });

  describe('ensureV1', () => {
    it('returns v1 definitions as-is', () => {
      const v1: TemplateDefinitionV1Type = {
        version: 1,
        steps: [sampleStep],
        documentBody: localized('Body text'),
      };

      const result = ensureV1(v1);
      expect(result).toBe(v1); // Same reference
    });

    it('compiles v2 definitions to v1', () => {
      const v2: TemplateDefinitionV2Type = {
        version: 2,
        steps: [sampleStep],
        sections: [
          {
            title: localized('Section'),
            body: localized('Content'),
            sortOrder: 0,
            parameters: [],
          },
        ],
      };

      const result = ensureV1(v2);
      expect(result.version).toBe(1);
      expect(result.documentBody.en).toContain('Section');
    });
  });
});
