import { z } from 'zod/v4';

// ============================================================
// Field Types (TDEF-03)
// ============================================================

export const FieldTypeEnum = z.enum([
  'text',
  'textarea',
  'date',
  'number',
  'currency',
  'email',
  'phone',
  'id-number',
  'select',
  'radio',
  'multi-select',
  'checkbox',
]);

export type FieldType = z.infer<typeof FieldTypeEnum>;

// ============================================================
// Localized String (I18N-04)
// ============================================================

export const LocalizedString = z.object({
  he: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().min(1),
});

export type LocalizedStringType = z.infer<typeof LocalizedString>;

// ============================================================
// Field Validation Rules (TDEF-05)
// ============================================================

export const FieldValidation = z
  .object({
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternError: LocalizedString.optional(),
  })
  .optional();

// ============================================================
// Field Option (for select, radio, multi-select)
// ============================================================

export const FieldOption = z.object({
  value: z.string(),
  label: LocalizedString,
});

// ============================================================
// Conditional Visibility (TDEF-07)
// ============================================================

export const ConditionOperator = z.enum(['equals', 'not_equals', 'is_truthy', 'is_falsy']);

export const FieldCondition = z.object({
  field: z.string(),
  operator: ConditionOperator,
  value: z.unknown().optional(),
});

// ============================================================
// Template Field (TDEF-04)
// ============================================================

export const TemplateField = z.object({
  key: z.string().min(1),
  type: FieldTypeEnum,
  label: LocalizedString,
  required: z.boolean(),
  placeholder: LocalizedString.optional(),
  validation: FieldValidation,
  options: z.array(FieldOption).optional(),
  condition: FieldCondition.optional(),
  width: z.enum(['full', 'half']).default('full'),
});

export type TemplateFieldType = z.infer<typeof TemplateField>;

// ============================================================
// Template Step (TDEF-02)
// ============================================================

export const TemplateStep = z.object({
  key: z.string().min(1),
  title: LocalizedString,
  description: LocalizedString.optional(),
  fields: z.array(TemplateField).min(1),
});

export type TemplateStepType = z.infer<typeof TemplateStep>;

// ============================================================
// v2 Section System (TDEF-08, TDEF-09)
// ============================================================

export const BindingParameter = z.object({
  placeholder: z.string(),
  fieldKey: z.string(),
  type: FieldTypeEnum,
});

export const SectionCondition = z.object({
  field: z.string(),
  operator: ConditionOperator,
  value: z.unknown().optional(),
});

export const TemplateSection = z.object({
  title: LocalizedString,
  body: LocalizedString,
  sortOrder: z.number().int().default(0),
  parameters: z.array(BindingParameter).default([]),
  condition: SectionCondition.optional(),
});

export type TemplateSectionType = z.infer<typeof TemplateSection>;

// ============================================================
// Monolingual Template (AI Parse Phase 2 intermediate format)
// ============================================================

export const MonolingualField = z.object({
  key: z.string().min(1),
  type: FieldTypeEnum,
  label: z.string().min(1),
  required: z.boolean(),
  placeholder: z.string().optional(),
  width: z.enum(['full', 'half']).default('full'),
});

export type MonolingualFieldType = z.infer<typeof MonolingualField>;

export const MonolingualStep = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(MonolingualField).min(1),
});

export type MonolingualStepType = z.infer<typeof MonolingualStep>;

export const MonolingualTemplate = z.object({
  version: z.literal(1),
  steps: z.array(MonolingualStep).min(1),
  documentBody: z.string().min(1),
});

export type MonolingualTemplateType = z.infer<typeof MonolingualTemplate>;

// ============================================================
// Template Definitions (TDEF-01)
// ============================================================

export const TemplateDefinitionV1 = z.object({
  version: z.literal(1),
  steps: z.array(TemplateStep).min(1),
  documentBody: LocalizedString,
});

export type TemplateDefinitionV1Type = z.infer<typeof TemplateDefinitionV1>;

export const TemplateDefinitionV2 = z.object({
  version: z.literal(2),
  steps: z.array(TemplateStep).min(1),
  sections: z.array(TemplateSection).min(1),
});

export type TemplateDefinitionV2Type = z.infer<typeof TemplateDefinitionV2>;

export const TemplateDefinition = z.union([TemplateDefinitionV1, TemplateDefinitionV2]);

export type TemplateDefinitionType = z.infer<typeof TemplateDefinition>;
