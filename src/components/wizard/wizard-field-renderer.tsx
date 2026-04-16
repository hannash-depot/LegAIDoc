'use client';

import type { TemplateFieldType } from '@/schemas/template-definition';
import {
  TextField,
  TextareaField,
  DateField,
  NumberField,
  CurrencyField,
  EmailField,
  PhoneField,
  IdNumberField,
  SelectField,
  RadioField,
  MultiSelectField,
  CheckboxField,
} from './wizard-fields';

interface WizardFieldRendererProps {
  field: TemplateFieldType;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  locale: string;
}

/**
 * WIZD-02: Dynamically renders the correct input component for each FieldType.
 */
export function WizardFieldRenderer({
  field,
  value,
  onChange,
  error,
  locale,
}: WizardFieldRendererProps) {
  const props = { field, value, onChange, error, locale };

  switch (field.type) {
    case 'text':
      return <TextField {...props} />;
    case 'textarea':
      return <TextareaField {...props} />;
    case 'date':
      return <DateField {...props} />;
    case 'number':
      return <NumberField {...props} />;
    case 'currency':
      return <CurrencyField {...props} />;
    case 'email':
      return <EmailField {...props} />;
    case 'phone':
      return <PhoneField {...props} />;
    case 'id-number':
      return <IdNumberField {...props} />;
    case 'select':
      return <SelectField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    case 'multi-select':
      return <MultiSelectField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    default:
      return null;
  }
}
