/**
 * Enhanced field type definitions for contract templates
 * Supports conditional display, validation, auto-calculation, and more
 */

import { LocalizedString } from "./template";

// Base field types
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "id-number"
  | "date"
  | "number"
  | "select"
  | "textarea"
  | "checkbox"
  | "radio"
  // Enhanced field types
  | "currency"
  | "percentage"
  | "date-range"
  | "multi-select"
  | "file-upload"
  | "signature-pad"
  | "address"
  | "repeater"
  | "rich-text"
  | "conditional"
  | "calculated";

// Field width options
export type FieldWidth = "full" | "half" | "third" | "quarter";

// Conditional operators
export type ConditionalOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "isEmpty"
  | "isNotEmpty"
  | "isTrue"
  | "isFalse";

// Conditional display configuration
export interface ConditionalDisplay {
  field: string; // Key of the field to check
  operator: ConditionalOperator;
  value?: unknown; // Value to compare against (not needed for isEmpty, isTrue, etc.)
  or?: ConditionalDisplay[]; // Multiple conditions with OR logic
  and?: ConditionalDisplay[]; // Multiple conditions with AND logic
}

// Auto-calculation configuration
export interface AutoCalculation {
  formula: string; // Expression to evaluate (e.g., "monthly_rent * 12")
  dependencies: string[]; // Field keys that trigger recalculation
  readonly?: boolean; // If true, user cannot edit the value
  format?: "currency" | "number" | "percentage"; // How to format the result
}

// Validation rules
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // Regex pattern
  patternMessage?: LocalizedString; // Error message for pattern mismatch
  custom?: string; // Name of custom validation function
  israeliId?: boolean; // Validate as Israeli ID number
  israeliPhone?: boolean; // Validate as Israeli phone number
  israeliVat?: boolean; // Validate as Israeli VAT number
  email?: boolean;
  url?: boolean;
  futureDate?: boolean; // Date must be in the future
  pastDate?: boolean; // Date must be in the past
  minAge?: number; // Minimum age in years
  dateRange?: {
    // Validate date range
    startField: string;
    endField: string;
    minDuration?: number; // Minimum duration in days
  };
}

// Help and guidance
export interface FieldHelp {
  tooltip?: LocalizedString; // Short tooltip on hover
  explanation?: LocalizedString; // Detailed explanation
  example?: LocalizedString; // Example value
  legalNote?: LocalizedString; // Legal considerations
  link?: {
    // Link to external resource
    url: LocalizedString;
    text: LocalizedString;
  };
}

// Select/Radio options
export interface FieldOption {
  value: string;
  label: LocalizedString;
  description?: LocalizedString;
  icon?: string;
  disabled?: boolean;
}

// Currency configuration
export interface CurrencyConfig {
  currencies?: string[]; // Allowed currencies (default: ["ILS", "USD", "EUR"])
  defaultCurrency?: string; // Default currency (default: "ILS")
  showCurrencySelector?: boolean; // Show dropdown to change currency
  min?: number;
  max?: number;
}

// Date range configuration
export interface DateRangeConfig {
  minDuration?: number; // Minimum duration in days
  maxDuration?: number; // Maximum duration in days
  defaultDuration?: number; // Default duration in days
}

// Repeater configuration (for dynamic lists)
export interface RepeaterConfig {
  minItems?: number; // Minimum number of items
  maxItems?: number; // Maximum number of items
  defaultItems?: number; // Default number of items to show
  addButtonText?: LocalizedString;
  removeButtonText?: LocalizedString;
  fields: FieldDefinition[]; // Fields to repeat
}

// File upload configuration
export interface FileUploadConfig {
  accept?: string[]; // Accepted file types (e.g., [".pdf", ".jpg"])
  maxSize?: number; // Max file size in bytes
  maxFiles?: number; // Maximum number of files
  required?: boolean;
}

// Base field definition
export interface BaseFieldDefinition {
  key: string; // Unique identifier
  type: FieldType;
  label: LocalizedString;
  placeholder?: LocalizedString;
  description?: LocalizedString;
  help?: FieldHelp;
  validation?: ValidationRules;
  defaultValue?: unknown;
  width?: FieldWidth;
  conditionalDisplay?: ConditionalDisplay;
  className?: string; // Additional CSS classes
}

// Field-specific configurations
export interface TextField extends BaseFieldDefinition {
  type: "text" | "email" | "phone" | "id-number" | "textarea";
  maxLength?: number;
  autoComplete?: string;
  format?: "uppercase" | "lowercase" | "capitalize"; // Auto-format input
}

export interface NumberField extends BaseFieldDefinition {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: LocalizedString; // Display unit (e.g., "kg", "m²")
}

export interface CurrencyField extends BaseFieldDefinition {
  type: "currency";
  config: CurrencyConfig;
  autoCalculate?: AutoCalculation;
}

export interface PercentageField extends BaseFieldDefinition {
  type: "percentage";
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

export interface DateField extends BaseFieldDefinition {
  type: "date";
  minDate?: string | "today"; // ISO date or "today"
  maxDate?: string | "today"; // ISO date or "today"
  excludeWeekends?: boolean;
  excludeDates?: string[]; // ISO dates to exclude
}

export interface DateRangeField extends BaseFieldDefinition {
  type: "date-range";
  config: DateRangeConfig;
  startLabel?: LocalizedString;
  endLabel?: LocalizedString;
}

export interface SelectField extends BaseFieldDefinition {
  type: "select" | "radio";
  options: FieldOption[];
  searchable?: boolean; // For select dropdowns
}

export interface MultiSelectField extends BaseFieldDefinition {
  type: "multi-select";
  options: FieldOption[];
  minSelections?: number;
  maxSelections?: number;
}

export interface CheckboxField extends BaseFieldDefinition {
  type: "checkbox";
  checkedValue?: unknown;
  uncheckedValue?: unknown;
}

export interface RepeaterField extends BaseFieldDefinition {
  type: "repeater";
  config: RepeaterConfig;
}

export interface FileUploadField extends BaseFieldDefinition {
  type: "file-upload";
  config: FileUploadConfig;
}

export interface SignaturePadField extends BaseFieldDefinition {
  type: "signature-pad";
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
}

export interface AddressField extends BaseFieldDefinition {
  type: "address";
  autocomplete?: boolean; // Use Google Places or similar
  components?: {
    // Which address components to capture
    street?: boolean;
    city?: boolean;
    postalCode?: boolean;
    country?: boolean;
  };
}

export interface CalculatedField extends BaseFieldDefinition {
  type: "calculated";
  calculation: AutoCalculation;
}

export interface RichTextField extends BaseFieldDefinition {
  type: "rich-text";
  toolbar?: string[]; // Which formatting buttons to show
  maxLength?: number;
}

// Union type of all field definitions
export type FieldDefinition =
  | TextField
  | NumberField
  | CurrencyField
  | PercentageField
  | DateField
  | DateRangeField
  | SelectField
  | MultiSelectField
  | CheckboxField
  | RepeaterField
  | FileUploadField
  | SignaturePadField
  | AddressField
  | CalculatedField
  | RichTextField;

// Field group for organizing fields
export interface FieldGroup {
  title?: LocalizedString;
  description?: LocalizedString;
  fields: FieldDefinition[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  conditionalDisplay?: ConditionalDisplay;
}

// Step with enhanced field groups
export interface TemplateStep {
  key: string;
  title: LocalizedString;
  description?: LocalizedString;
  icon?: string;
  groups?: FieldGroup[];
  fields?: FieldDefinition[]; // Can use fields directly or organize into groups
  optional?: boolean;
  conditionalDisplay?: ConditionalDisplay;
}

// Helper type guards
export function isCurrencyField(field: FieldDefinition): field is CurrencyField {
  return field.type === "currency";
}

export function isCalculatedField(
  field: FieldDefinition
): field is CalculatedField {
  return field.type === "calculated";
}

export function isRepeaterField(field: FieldDefinition): field is RepeaterField {
  return field.type === "repeater";
}

export function hasConditionalDisplay(field: FieldDefinition): boolean {
  return field.conditionalDisplay !== undefined;
}
