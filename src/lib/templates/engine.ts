import type { DocumentSection, FieldCondition } from "@/types/template";

/**
 * Renders a contract document by replacing placeholders in the template
 * with actual user data.
 */
export function renderDocument(
  sections: DocumentSection[],
  data: Record<string, unknown>,
  unfilledPlaceholder = "______"
): string {
  return sections
    .filter((section) => !section.showIf || isTruthy(data[section.showIf]))
    .map((section) => {
      const title = replacePlaceholders(section.title, data, unfilledPlaceholder);
      const body = processTemplate(section.body, data, unfilledPlaceholder);
      return `<div class="contract-section"><h2>${title}</h2>${body}</div>`;
    })
    .join("\n");
}

/**
 * Processes a template string: handles conditionals, loops, and placeholders.
 */
function processTemplate(
  template: string,
  data: Record<string, unknown>,
  unfilledPlaceholder: string
): string {
  let result = template;

  // Process {{#if field_key}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      const value = data[key];
      if (isTruthy(value)) {
        return processTemplate(content, data, unfilledPlaceholder);
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
        return processTemplate(content, data, unfilledPlaceholder);
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
            return processTemplate(content, itemData as Record<string, unknown>, unfilledPlaceholder);
          })
          .join("");
      }
      return "";
    }
  );

  // Replace {{placeholder}} with actual values
  result = replacePlaceholders(result, data, unfilledPlaceholder);

  return result;
}

/**
 * Replaces {{key}} placeholders with values from data.
 */
function replacePlaceholders(
  text: string,
  data: Record<string, unknown>,
  unfilledPlaceholder: string
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = data[key];
    if (value === undefined || value === null || value === "") {
      return `<span class="unfilled">${unfilledPlaceholder}</span>`;
    }
    return escapeHtml(String(value));
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
