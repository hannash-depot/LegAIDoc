import type {
  TemplateDefinitionV1Type,
  TemplateDefinitionV2Type,
  TemplateDefinitionType,
  LocalizedStringType,
} from '@/schemas/template-definition';

// In-memory cache for compiled v2→v1 definitions, keyed by caller-provided key.
const v1Cache = new Map<string, TemplateDefinitionV1Type>();

/**
 * TDEF-10: Compile v2 definition to v1 by flattening sections into documentBody.
 * Sections are sorted by sortOrder and their body text is concatenated.
 */
export function compileV2toV1(definition: TemplateDefinitionV2Type): TemplateDefinitionV1Type {
  const sortedSections = [...definition.sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const locales = ['he', 'ar', 'en', 'ru'] as const;

  const documentBody: LocalizedStringType = {
    he: '',
    ar: '',
    en: '',
    ru: '',
  };

  for (const locale of locales) {
    const parts: string[] = [];
    for (let i = 0; i < sortedSections.length; i++) {
      const section = sortedSections[i];
      const title = section.title[locale];
      const body = section.body[locale];
      parts.push(`<h2>${i + 1}. ${title}</h2>\n${body}`);
    }
    documentBody[locale] = parts.join('\n\n');
  }

  return {
    version: 1,
    steps: definition.steps,
    documentBody,
  };
}

/**
 * Ensure a definition is in v1 format.
 * If already v1, returns as-is. If v2, compiles to v1.
 * Pass an optional cacheKey (e.g. `${template.id}:${template.version}`) to
 * memoize the result and avoid recomputation on repeated calls.
 */
export function ensureV1(
  definition: TemplateDefinitionType,
  cacheKey?: string,
): TemplateDefinitionV1Type {
  if (definition.version === 1) {
    return definition;
  }
  if (cacheKey) {
    const cached = v1Cache.get(cacheKey);
    if (cached) return cached;
  }
  const result = compileV2toV1(definition);
  if (cacheKey) {
    v1Cache.set(cacheKey, result);
  }
  return result;
}
