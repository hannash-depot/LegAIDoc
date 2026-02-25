import type {
  EnhancedTemplateDefinition,
  TemplateSection,
  TemplateSubsection,
  SectionCondition,
} from "@/types/admin-template";
import type {
  TemplateDefinition,
  DocumentSection,
  LocalizedDocumentBody,
} from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";
import { locales } from "@/lib/i18n/routing";

/**
 * Type guard to check if a definition is the enhanced v2 format.
 */
export function isEnhancedDefinition(
  def: unknown
): def is EnhancedTemplateDefinition {
  return (
    typeof def === "object" &&
    def !== null &&
    "version" in def &&
    (def as { version: number }).version >= 2 &&
    "sections" in def
  );
}

/**
 * Compiles an EnhancedTemplateDefinition (v2) into the runtime
 * TemplateDefinition format (v1) that the wizard/renderer consumes.
 * For v1 definitions, this is a pass-through.
 */
export function compileDefinition(
  definition: EnhancedTemplateDefinition | TemplateDefinition
): TemplateDefinition {
  if (!isEnhancedDefinition(definition)) {
    return definition as TemplateDefinition;
  }

  const enhanced = definition;
  const documentBody = {} as LocalizedDocumentBody;

  for (const locale of locales) {
    documentBody[locale] = compileSectionsForLocale(enhanced.sections, locale);
  }

  return {
    version: enhanced.version,
    steps: enhanced.steps,
    documentBody,
  };
}

/**
 * Compiles sections and subsections into flat DocumentSection[] for a given locale.
 */
function compileSectionsForLocale(
  sections: TemplateSection[],
  locale: Locale
): DocumentSection[] {
  const result: DocumentSection[] = [];
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const section of sorted) {
    const body = wrapWithCondition(section.body[locale], section.condition);
    result.push({
      title: section.title[locale],
      body,
    });

    const sortedSubs = [...section.subsections].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    for (const sub of sortedSubs) {
      const subBody = wrapWithCondition(sub.body[locale], sub.condition);
      result.push({
        title: sub.title[locale],
        body: subBody,
      });
    }
  }

  return result;
}

/**
 * Wraps body content with a conditional block if the section has a condition.
 */
function wrapWithCondition(
  body: string,
  condition?: SectionCondition
): string {
  if (!condition || !body) return body;

  switch (condition.operator) {
    case "equals":
      // For equality checks, we use a truthy check on the field
      // The template engine's {{#if}} block handles presence checks
      // For exact value matching, we use a computed approach
      return `{{#if ${condition.field}}}${body}{{/if}}`;
    case "not_equals":
      return `{{#unless ${condition.field}}}${body}{{/unless}}`;
    case "is_truthy":
      return `{{#if ${condition.field}}}${body}{{/if}}`;
    case "is_falsy":
      return `{{#unless ${condition.field}}}${body}{{/unless}}`;
    default:
      // For other operators (in, not_in), default to truthy check
      return `{{#if ${condition.field}}}${body}{{/if}}`;
  }
}

/**
 * Extracts all binding parameter keys from a template body string.
 * Ignores control flow syntax ({{#if}}, {{/if}}, {{#each}}, etc.).
 */
export function extractParameterKeys(body: string): string[] {
  const matches = body.matchAll(/\{\{(\w+)\}\}/g);
  const keys = new Set<string>();

  for (const match of matches) {
    const key = match[1];
    // Skip template control flow keywords
    if (!key.startsWith("#") && !key.startsWith("/") && key !== "this") {
      keys.add(key);
    }
  }

  return Array.from(keys);
}
