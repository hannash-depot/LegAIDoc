import type { LocalizedString, FieldType, FieldCondition, TemplateStep } from "./template";

// ====================================================
// BINDING PARAMETERS
// ====================================================

/** A binding parameter ({{placeholder}}) used within a section's body template */
export interface BindingParameter {
  key: string;
  label: LocalizedString;
  type: FieldType;
  required: boolean;
  defaultValue?: string;
  description?: LocalizedString;
}

// ====================================================
// SECTION CONDITIONS
// ====================================================

/** Condition that determines whether a section/subsection is included */
export interface SectionCondition {
  field: string;
  operator: FieldCondition["operator"];
  value?: unknown;
}

// ====================================================
// SUBSECTIONS & SECTIONS
// ====================================================

/** A subsection within a section */
export interface TemplateSubsection {
  id: string;
  title: LocalizedString;
  body: LocalizedString;
  mandatory: boolean;
  condition?: SectionCondition;
  sortOrder: number;
  parameters: BindingParameter[];
}

/** A top-level section of the document */
export interface TemplateSection {
  id: string;
  title: LocalizedString;
  body: LocalizedString;
  mandatory: boolean;
  condition?: SectionCondition;
  sortOrder: number;
  parameters: BindingParameter[];
  subsections: TemplateSubsection[];
}

// ====================================================
// ENHANCED TEMPLATE DEFINITION (v2)
// ====================================================

/**
 * EnhancedTemplateDefinition is the new shape stored in the `definition` JSON column.
 * It extends the original with structured sections instead of flat DocumentSection[].
 * The `version` field is 2 to distinguish from v1 definitions.
 */
export interface EnhancedTemplateDefinition {
  version: 2;
  steps: TemplateStep[];
  sections: TemplateSection[];
}

// ====================================================
// ADMIN TEMPLATE FORM DATA
// ====================================================

export interface AdminTemplateFormData {
  slug: string;
  categoryId: string;
  name: LocalizedString;
  description: LocalizedString;
  isActive: boolean;
  definition: EnhancedTemplateDefinition;
}
