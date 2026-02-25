import type {
  DocumentSection,
  FieldCondition,
  TemplateDefinition,
} from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";

export interface RenderOptions {
  /** Template definition - used to resolve select/radio labels and add disclaimer */
  definition?: TemplateDefinition;
  /** Locale for resolving option labels and disclaimer text */
  locale?: Locale;
  /** Whether to prepend legal disclaimer (default: true when legalCompliance exists) */
  showDisclaimer?: boolean;
}

/**
 * Builds a map of field key -> display value resolver for select/radio fields.
 * When rendering {{payment_method}}, we output the label (e.g. "העברה בנקאית") not the value ("bank_transfer").
 */
function buildOptionResolvers(
  steps: TemplateDefinition["steps"],
  locale: Locale
): Map<string, (value: unknown) => string> {
  const resolvers = new Map<string, (value: unknown) => string>();
  for (const step of steps) {
    for (const field of step.fields) {
      if (
        (field.type === "select" || field.type === "radio") &&
        field.options?.length
      ) {
        const options = field.options;
        resolvers.set(field.key, (value) => {
          if (value === undefined || value === null || value === "") return "";
          const opt = options.find((o) => o.value === value);
          return opt?.label[locale] ?? String(value);
        });
      }
    }
  }
  return resolvers;
}

/**
 * Renders a contract document by replacing placeholders in the template
 * with actual user data. Supports select/radio label resolution and legal disclaimer.
 */
export function renderDocument(
  sections: DocumentSection[],
  data: Record<string, unknown>,
  unfilledPlaceholder = "______",
  options?: RenderOptions
): string {
  const locale = options?.locale ?? "he";
  const optionResolvers =
    options?.definition?.steps != null
      ? buildOptionResolvers(options.definition.steps, locale)
      : null;

  const resolveValue = (key: string, value: unknown): string => {
    const resolver = optionResolvers?.get(key);
    if (resolver) return resolver(value);
    return value === undefined || value === null || value === ""
      ? ""
      : String(value);
  };

  const content = sections
    .map((section) => {
      const title = replacePlaceholders(
        section.title,
        data,
        unfilledPlaceholder,
        resolveValue
      );
      const body = processTemplate(
        section.body,
        data,
        unfilledPlaceholder,
        resolveValue
      );
      return `<div class="contract-section"><h2>${title}</h2>${body}</div>`;
    })
    .join("\n");

  // Add legal disclaimer when legalCompliance is present
  const showDisclaimer =
    options?.showDisclaimer !== false &&
    options?.definition?.legalCompliance?.warnings;
  const disclaimerHtml = showDisclaimer
    ? `<div class="contract-disclaimer">${escapeHtml(
        options!.definition!.legalCompliance!.warnings[locale] ??
          options!.definition!.legalCompliance!.warnings.he
      )}</div>`
    : "";

  return disclaimerHtml + content;
}

type ResolveValueFn = (key: string, value: unknown) => string;

/**
 * Processes a template string: handles conditionals, loops, and placeholders.
 */
function processTemplate(
  template: string,
  data: Record<string, unknown>,
  unfilledPlaceholder: string,
  resolveValue?: ResolveValueFn
): string {
  let result = template;

  // Process {{#if field_key}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      const value = data[key];
      if (isTruthy(value)) {
        return processTemplate(content, data, unfilledPlaceholder, resolveValue);
      }
      return "";
    }
  );

  // Process {{#unless field_key}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key: string, content: string) => {
      const value = data[key];
      if (!isTruthy(value)) {
        return processTemplate(content, data, unfilledPlaceholder, resolveValue);
      }
      return "";
    }
  );

  // Process {{#each array_key}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, key: string, content: string) => {
      const arr = data[key];
      if (Array.isArray(arr)) {
        return arr
          .map((item, index) => {
            const itemData =
              typeof item === "object" && item !== null
                ? { ...data, ...item, "@index": index }
                : { ...data, this: item, "@index": index };
            return processTemplate(content, itemData as Record<string, unknown>, unfilledPlaceholder, resolveValue);
          })
          .join("");
      }
      return "";
    }
  );

  // Replace {{placeholder}} with actual values
  result = replacePlaceholders(result, data, unfilledPlaceholder, resolveValue);

  return result;
}

/**
 * Replaces {{key}} placeholders with values from data.
 * Uses resolveValue when provided to resolve select/radio labels.
 */
function replacePlaceholders(
  text: string,
  data: Record<string, unknown>,
  unfilledPlaceholder: string,
  resolveValue?: ResolveValueFn
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = data[key];
    if (value === undefined || value === null || value === "") {
      return `<span class="unfilled">${unfilledPlaceholder}</span>`;
    }
    const displayValue = resolveValue ? resolveValue(key, value) : String(value);
    return escapeHtml(displayValue);
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === "") {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

/**
 * Evaluates a field condition against the current form data.
 */
export function evaluateCondition(
  condition: FieldCondition,
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "not_in":
      return (
        Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      );
    case "is_truthy":
      return isTruthy(fieldValue);
    case "is_falsy":
      return !isTruthy(fieldValue);
    default:
      return true;
  }
}
