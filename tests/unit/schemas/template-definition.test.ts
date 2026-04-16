import { describe, it, expect } from 'vitest';
import {
  TemplateDefinitionV1,
  TemplateDefinitionV2,
  TemplateDefinition,
  TemplateField,
  TemplateStep,
} from '@/schemas/template-definition';

const localized = (text: string) => ({ he: text, ar: text, en: text, ru: text });

describe('template-definition schemas', () => {
  describe('TemplateField (TDEF-04)', () => {
    it('accepts a valid text field', () => {
      const result = TemplateField.safeParse({
        key: 'name',
        type: 'text',
        label: localized('Name'),
        required: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts a select field with options', () => {
      const result = TemplateField.safeParse({
        key: 'country',
        type: 'select',
        label: localized('Country'),
        required: true,
        options: [
          { value: 'IL', label: localized('Israel') },
          { value: 'US', label: localized('USA') },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects a field with missing label locale', () => {
      const result = TemplateField.safeParse({
        key: 'name',
        type: 'text',
        label: { he: 'Name', en: 'Name', ar: 'Name' }, // missing ru
        required: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty key', () => {
      const result = TemplateField.safeParse({
        key: '',
        type: 'text',
        label: localized('Name'),
        required: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid field type', () => {
      const result = TemplateField.safeParse({
        key: 'name',
        type: 'invalid-type',
        label: localized('Name'),
        required: true,
      });
      expect(result.success).toBe(false);
    });

    it('accepts conditional visibility (TDEF-07)', () => {
      const result = TemplateField.safeParse({
        key: 'spouse_name',
        type: 'text',
        label: localized('Spouse Name'),
        required: false,
        condition: {
          field: 'marital_status',
          operator: 'equals',
          value: 'married',
        },
      });
      expect(result.success).toBe(true);
    });

    it('defaults width to full', () => {
      const result = TemplateField.safeParse({
        key: 'name',
        type: 'text',
        label: localized('Name'),
        required: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.width).toBe('full');
      }
    });
  });

  describe('TemplateStep (TDEF-02)', () => {
    it('accepts a valid step with fields', () => {
      const result = TemplateStep.safeParse({
        key: 'parties',
        title: localized('Parties'),
        fields: [
          {
            key: 'landlord_name',
            type: 'text',
            label: localized('Landlord Name'),
            required: true,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects a step with no fields', () => {
      const result = TemplateStep.safeParse({
        key: 'empty',
        title: localized('Empty'),
        fields: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TemplateDefinitionV1 (TDEF-01)', () => {
    const validV1 = {
      version: 1,
      steps: [
        {
          key: 'basics',
          title: localized('Basics'),
          fields: [
            {
              key: 'name',
              type: 'text',
              label: localized('Full Name'),
              required: true,
            },
          ],
        },
      ],
      documentBody: localized('Contract for {{name}}'),
    };

    it('accepts a valid v1 definition', () => {
      const result = TemplateDefinitionV1.safeParse(validV1);
      expect(result.success).toBe(true);
    });

    it('rejects version 2 as v1', () => {
      const result = TemplateDefinitionV1.safeParse({ ...validV1, version: 2 });
      expect(result.success).toBe(false);
    });
  });

  describe('TemplateDefinitionV2 (TDEF-08)', () => {
    const validV2 = {
      version: 2,
      steps: [
        {
          key: 'basics',
          title: localized('Basics'),
          fields: [
            {
              key: 'name',
              type: 'text',
              label: localized('Name'),
              required: true,
            },
          ],
        },
      ],
      sections: [
        {
          title: localized('Introduction'),
          body: localized('This contract is between {{name}}.'),
          sortOrder: 0,
          parameters: [{ placeholder: 'name', fieldKey: 'name', type: 'text' }],
        },
      ],
    };

    it('accepts a valid v2 definition', () => {
      const result = TemplateDefinitionV2.safeParse(validV2);
      expect(result.success).toBe(true);
    });

    it('rejects v2 with no sections', () => {
      const result = TemplateDefinitionV2.safeParse({ ...validV2, sections: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('TemplateDefinition (union)', () => {
    it('accepts both v1 and v2', () => {
      const v1 = TemplateDefinition.safeParse({
        version: 1,
        steps: [
          {
            key: 'step1',
            title: localized('Step 1'),
            fields: [{ key: 'f1', type: 'text', label: localized('F1'), required: true }],
          },
        ],
        documentBody: localized('Body'),
      });
      expect(v1.success).toBe(true);

      const v2 = TemplateDefinition.safeParse({
        version: 2,
        steps: [
          {
            key: 'step1',
            title: localized('Step 1'),
            fields: [{ key: 'f1', type: 'text', label: localized('F1'), required: true }],
          },
        ],
        sections: [
          {
            title: localized('Sec 1'),
            body: localized('Body'),
            sortOrder: 0,
          },
        ],
      });
      expect(v2.success).toBe(true);
    });

    it('rejects version 3', () => {
      const result = TemplateDefinition.safeParse({
        version: 3,
        steps: [
          {
            key: 'step1',
            title: localized('Step 1'),
            fields: [{ key: 'f1', type: 'text', label: localized('F1'), required: true }],
          },
        ],
        documentBody: localized('Body'),
      });
      expect(result.success).toBe(false);
    });
  });
});
