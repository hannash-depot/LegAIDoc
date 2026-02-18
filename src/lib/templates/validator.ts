import { z } from "zod";
import type { TemplateField, TemplateStep } from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Builds a Zod validation schema dynamically from template field definitions.
 */
export function buildStepSchema(
  step: TemplateStep,
  locale: Locale
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of step.fields) {
    shape[field.key] = buildFieldSchema(field, locale);
  }

  return z.object(shape);
}

function buildFieldSchema(field: TemplateField, locale: Locale): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "text":
    case "textarea":
    case "phone":
    case "id-number":
      schema = buildStringSchema(field, locale);
      break;

    case "email":
      schema = z.string().email();
      break;

    case "number":
    case "currency":
      schema = buildNumberSchema(field);
      break;

    case "date":
      schema = z.string().min(1);
      break;

    case "select":
    case "radio":
      schema = z.string();
      if (field.options && field.options.length > 0) {
        const values = field.options.map((o) => o.value);
        schema = z.enum(values as [string, ...string[]]);
      }
      break;

    case "multi-select":
      if (field.options && field.options.length > 0) {
        const values = field.options.map((o) => o.value);
        schema = z.array(z.enum(values as [string, ...string[]]));
      } else {
        schema = z.array(z.string());
      }
      break;

    case "checkbox":
      schema = z.boolean();
      break;

    default:
      schema = z.any();
  }

  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}

function buildStringSchema(field: TemplateField, locale: Locale): z.ZodString {
  let schema = z.string();

  if (field.required) {
    schema = schema.min(1);
  }

  if (field.validation?.minLength) {
    schema = schema.min(field.validation.minLength);
  }

  if (field.validation?.maxLength) {
    schema = schema.max(field.validation.maxLength);
  }

  if (field.validation?.pattern) {
    const message = field.validation.patternMessage?.[locale] ?? "Invalid format";
    schema = schema.regex(new RegExp(field.validation.pattern), message);
  }

  return schema;
}

function buildNumberSchema(field: TemplateField): z.ZodNumber {
  let schema = z.number();

  if (field.validation?.min !== undefined) {
    schema = schema.min(field.validation.min);
  }

  if (field.validation?.max !== undefined) {
    schema = schema.max(field.validation.max);
  }

  return schema;
}

/**
 * Validates user data for a given wizard step.
 */
export function validateStepData(
  step: TemplateStep,
  data: Record<string, unknown>,
  locale: Locale
): { success: boolean; errors: Record<string, string> } {
  const schema = buildStepSchema(step, locale);
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString();
    if (key) {
      errors[key] = issue.message;
    }
  }

  return { success: false, errors };
}
