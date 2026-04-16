import type { TemplateDefinitionType, LocalizedStringType } from '@/schemas/template-definition';

type Lang = 'he' | 'ar' | 'en' | 'ru';

interface StringEntry {
  id: string;
  path: string;
  value: string;
}

export interface ExtractedStrings {
  entries: StringEntry[];
  map: Record<string, string>; // id → value
}

/**
 * Walk a template definition + metadata and extract all non-empty strings
 * for the given source language into a numbered map.
 */
export function extractStrings(
  metadata: { nameHe?: string; descHe?: string } | null,
  definition: TemplateDefinitionType,
  sourceLang: Lang = 'he',
): ExtractedStrings {
  const entries: StringEntry[] = [];
  let counter = 0;

  function add(path: string, value: string) {
    if (!value?.trim()) return;
    counter++;
    entries.push({ id: String(counter), path, value });
  }

  function extractLocalized(path: string, obj: LocalizedStringType) {
    add(path, obj[sourceLang]);
  }

  // Metadata
  if (metadata?.nameHe?.trim()) add('meta.name', metadata.nameHe);
  if (metadata?.descHe?.trim()) add('meta.desc', metadata.descHe);

  // Steps
  definition.steps.forEach((step, si) => {
    extractLocalized(`steps[${si}].title`, step.title);
    if (step.description) {
      extractLocalized(`steps[${si}].description`, step.description);
    }

    step.fields.forEach((field, fi) => {
      extractLocalized(`steps[${si}].fields[${fi}].label`, field.label);
      if (field.placeholder) {
        extractLocalized(`steps[${si}].fields[${fi}].placeholder`, field.placeholder);
      }
      if (field.options) {
        field.options.forEach((opt, oi) => {
          extractLocalized(`steps[${si}].fields[${fi}].options[${oi}].label`, opt.label);
        });
      }
      if (field.validation?.patternError) {
        extractLocalized(
          `steps[${si}].fields[${fi}].validation.patternError`,
          field.validation.patternError,
        );
      }
    });
  });

  // V1 document body
  if (definition.version === 1) {
    extractLocalized('documentBody', definition.documentBody);
  }

  // V2 sections
  if (definition.version === 2) {
    definition.sections.forEach((section, si) => {
      extractLocalized(`sections[${si}].title`, section.title);
      extractLocalized(`sections[${si}].body`, section.body);
    });
  }

  const map: Record<string, string> = {};
  for (const entry of entries) {
    map[entry.id] = entry.value;
  }

  return { entries, map };
}

/**
 * Inject translated strings back into a template definition + metadata.
 * Mutates the objects in place for efficiency.
 */
export function injectStrings(
  metadata: Record<string, string> | null,
  definition: TemplateDefinitionType,
  targetLang: Lang,
  entries: StringEntry[],
  translatedMap: Record<string, string>,
): void {
  const langSuffix = targetLang.charAt(0).toUpperCase() + targetLang.slice(1); // "Ar", "En", "Ru"

  for (const entry of entries) {
    const translated = translatedMap[entry.id];
    if (!translated) continue;

    const { path } = entry;

    // Metadata fields
    if (path === 'meta.name' && metadata) {
      metadata[`name${langSuffix}`] = translated;
      continue;
    }
    if (path === 'meta.desc' && metadata) {
      metadata[`desc${langSuffix}`] = translated;
      continue;
    }

    // Walk the path to find the LocalizedString and set the target lang
    setNestedLocalized(definition, path, targetLang, translated);
  }
}

function setNestedLocalized(obj: unknown, path: string, lang: Lang, value: string): void {
  // Parse path like "steps[0].fields[1].label" or "documentBody" or "sections[0].body"
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');

  let current: unknown = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (current == null || typeof current !== 'object') return;

    if (i === parts.length - 1) {
      // This is the LocalizedString object — set the target language
      const localized = (current as Record<string, unknown>)[key];
      if (localized && typeof localized === 'object') {
        (localized as Record<string, string>)[lang] = value;
      }
    } else {
      const idx = Number(key);
      if (!isNaN(idx)) {
        current = (current as unknown[])[idx];
      } else {
        current = (current as Record<string, unknown>)[key];
      }
    }
  }
}
