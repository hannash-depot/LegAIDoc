'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateFieldType } from '@/schemas/template-definition';

interface FieldProps {
  field: TemplateFieldType;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  locale: string;
}

function getLabel(field: TemplateFieldType, locale: string): string {
  return field.label[locale as keyof typeof field.label] || field.label.en;
}

function getPlaceholder(field: TemplateFieldType, locale: string): string | undefined {
  if (!field.placeholder) return undefined;
  return field.placeholder[locale as keyof typeof field.placeholder] || field.placeholder.en;
}

export function TextField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="text"
        placeholder={getPlaceholder(field, locale)}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
        required={field.required}
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextareaField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Textarea
        name={field.key}
        value={(value as string) || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={getPlaceholder(field, locale)}
        rows={4}
        aria-invalid={!!error}
        required={field.required}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function DateField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="date"
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
        required={field.required}
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function NumberField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="number"
        placeholder={getPlaceholder(field, locale)}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(field.key, e.target.value ? Number(e.target.value) : undefined)
        }
        required={field.required}
        min={field.validation?.min}
        max={field.validation?.max}
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function CurrencyField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <div className="relative">
        <span className="text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 text-base">
          ₪
        </span>
        <input
          name={field.key}
          type="number"
          step="0.01"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(field.key, e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder={getPlaceholder(field, locale)}
          className={`text-foreground placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full rounded-lg border py-2 ps-8 pe-3 text-base transition-colors duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20'
              : 'border-input bg-background'
          }`}
          aria-invalid={!!error}
          required={field.required}
          dir="ltr"
        />
      </div>
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function EmailField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="email"
        placeholder={getPlaceholder(field, locale) || 'name@example.com'}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
        required={field.required}
        dir="ltr"
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function PhoneField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="tel"
        placeholder={getPlaceholder(field, locale) || '05X-XXXXXXX'}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
        required={field.required}
        dir="ltr"
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function IdNumberField({ field, value, onChange, error, locale }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Input
        name={field.key}
        type="text"
        placeholder={getPlaceholder(field, locale)}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
        required={field.required}
        dir="ltr"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-invalid={!!error}
        className={
          error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''
        }
      />
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({ field, value, onChange, error, locale }: FieldProps) {
  const options = field.options || [];
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </label>
      <Select value={(value as string) || ''} onValueChange={(val) => onChange(field.key, val)}>
        <SelectTrigger
          className={`w-full ${error ? 'border-red-500 bg-red-50 dark:border-red-500/50 dark:bg-red-950/20' : ''}`}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={getPlaceholder(field, locale) || '—'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label[locale as keyof typeof opt.label] || opt.label.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function RadioField({ field, value, onChange, error, locale }: FieldProps) {
  const options = field.options || [];
  return (
    <fieldset
      className={`space-y-3 ${error ? '-m-3 rounded-lg border border-red-500 bg-red-50 p-3 dark:border-red-500/50 dark:bg-red-950/20' : ''}`}
    >
      <legend className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </legend>
      <RadioGroup
        value={(value as string) || ''}
        onValueChange={(val) => onChange(field.key, val)}
        className="space-y-2"
        aria-invalid={!!error}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value={opt.value} id={`${field.key}-${opt.value}`} />
            <label
              htmlFor={`${field.key}-${opt.value}`}
              className="cursor-pointer text-base leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {opt.label[locale as keyof typeof opt.label] || opt.label.en}
            </label>
          </div>
        ))}
      </RadioGroup>
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function MultiSelectField({ field, value, onChange, error, locale }: FieldProps) {
  const options = field.options || [];
  const selectedValues = (value as string[]) || [];

  const toggleValue = (optValue: string, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onChange(field.key, [...selectedValues, optValue]);
    } else {
      onChange(
        field.key,
        selectedValues.filter((v) => v !== optValue),
      );
    }
  };

  return (
    <fieldset
      className={`space-y-3 ${error ? '-m-3 rounded-lg border border-red-500 bg-red-50 p-3 dark:border-red-500/50 dark:bg-red-950/20' : ''}`}
    >
      <legend className="text-foreground block text-base font-medium">
        {getLabel(field, locale)}
      </legend>
      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={`${field.key}-${opt.value}`}
              checked={selectedValues.includes(opt.value)}
              onCheckedChange={(checked) => toggleValue(opt.value, checked)}
            />
            <label
              htmlFor={`${field.key}-${opt.value}`}
              className="cursor-pointer text-base leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {opt.label[locale as keyof typeof opt.label] || opt.label.en}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function CheckboxField({ field, value, onChange, error, locale }: FieldProps) {
  // Ensure checkbox always has an explicit boolean so the preview shows "לא"/"No" for unchecked
  useEffect(() => {
    if (value === undefined) onChange(field.key, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`flex h-full flex-col justify-end space-y-1.5 pt-6 ${error ? '-m-3 rounded-lg border border-red-500 bg-red-50 p-3 dark:border-red-500/50 dark:bg-red-950/20' : ''}`}
    >
      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id={field.key}
          checked={!!value}
          onCheckedChange={(checked) => onChange(field.key, checked === true)}
          aria-invalid={!!error}
        />
        <label htmlFor={field.key} className="cursor-pointer text-base leading-none font-medium">
          {getLabel(field, locale)}
        </label>
      </div>
      {error && (
        <p className="text-destructive text-base" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
