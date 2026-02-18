export interface LocalizedString {
  he: string;
  ar: string;
  en: string;
  ru: string;
}

export interface TemplateDefinition {
  version: number;
  steps: TemplateStep[];
  documentBody: LocalizedDocumentBody;
}

export interface TemplateStep {
  key: string;
  title: LocalizedString;
  description?: LocalizedString;
  fields: TemplateField[];
}

export interface TemplateField {
  key: string;
  type: FieldType;
  label: LocalizedString;
  placeholder?: LocalizedString;
  helpText?: LocalizedString;
  required: boolean;
  defaultValue?: unknown;
  validation?: FieldValidation;
  options?: FieldOption[];
  condition?: FieldCondition;
  width?: "full" | "half";
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multi-select"
  | "radio"
  | "checkbox"
  | "email"
  | "phone"
  | "id-number"
  | "currency";

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: LocalizedString;
}

export interface FieldOption {
  value: string;
  label: LocalizedString;
}

export interface FieldCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "is_truthy"
    | "is_falsy";
  value?: unknown;
}

export interface LocalizedDocumentBody {
  he: DocumentSection[];
  ar: DocumentSection[];
  en: DocumentSection[];
  ru: DocumentSection[];
}

export interface DocumentSection {
  title: string;
  body: string;
}
