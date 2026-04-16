import type { TemplateDefinitionV1Type, TemplateSectionType } from '@/schemas/template-definition';
import type { Locale } from '@/lib/utils/locale';
import { escapeHtml } from '@/lib/sanitize';

/** Localized boolean labels for rendering checkbox values in documents. */
const BOOLEAN_LABELS: Record<string, [string, string]> = {
  he: ['כן', 'לא'],
  ar: ['نعم', 'لا'],
  en: ['Yes', 'No'],
  ru: ['Да', 'Нет'],
};

/** Placeholder HTML for unfilled fields — dotted underline style. */
const UNFILLED_PLACEHOLDER =
  '<span style="border-bottom:2px dotted #9ca3af;padding:0 0.5em;color:#9ca3af">___</span>';

/** Format a wizard value for display in the rendered document. */
function formatValue(value: unknown, locale: Locale): string {
  if (value === undefined || value === null || value === '') {
    return UNFILLED_PLACEHOLDER;
  }
  if (typeof value === 'boolean') {
    const labels = BOOLEAN_LABELS[locale] || BOOLEAN_LABELS.en;
    return value ? labels[0] : labels[1];
  }
  if (Array.isArray(value)) return escapeHtml(value.join(', '));
  return escapeHtml(String(value));
}

/**
 * Evaluates a condition against wizard data.
 */
function evaluateCondition(
  condition: { field: string; operator: string; value?: unknown } | undefined,
  data: Record<string, unknown>,
): boolean {
  if (!condition) return true;

  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'is_truthy':
      return !!fieldValue;
    case 'is_falsy':
      return !fieldValue;
    default:
      return true;
  }
}

/**
 * Renders a v1 template definition with user-provided wizard data.
 * Replaces all {{placeholder}} bindings with actual values.
 * Returns the rendered HTML string for the given locale.
 */
export function renderTemplate(
  definition: TemplateDefinitionV1Type,
  wizardData: Record<string, unknown>,
  locale: Locale,
): string {
  let html = definition.documentBody[locale];

  // Replace all {{placeholder}} with wizard data values
  html = html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return formatValue(wizardData[key], locale);
  });

  return html;
}

/**
 * Renders v2 sections with conditional evaluation.
 * Returns an array of rendered HTML sections for the given locale.
 */
export function renderSections(
  sections: TemplateSectionType[],
  wizardData: Record<string, unknown>,
  locale: Locale,
): string[] {
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const results: string[] = [];
  let sectionNum = 0;

  for (const section of sortedSections) {
    // TDEF-09: Evaluate section condition
    if (!evaluateCondition(section.condition, wizardData)) {
      continue;
    }

    sectionNum++;
    let body = section.body[locale];

    // Replace bindings
    for (const param of section.parameters) {
      const displayValue = formatValue(wizardData[param.fieldKey], locale);
      body = body.replaceAll(`{{${param.placeholder}}}`, displayValue);
    }

    // Also handle any remaining generic placeholders
    body = body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      return formatValue(wizardData[key], locale);
    });

    const title = escapeHtml(section.title[locale]);
    results.push(`<section>\n<h2>${sectionNum}. ${title}</h2>\n${body}\n</section>`);
  }

  return results;
}

/**
 * Wraps rendered content in a full HTML document for PDF generation.
 * Includes BiDi support for RTL locales.
 */
export function wrapInHtmlDocument(content: string, locale: Locale, title: string): string {
  const isRtl = locale === 'he' || locale === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Helvetica Neue', 'Tahoma', sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      direction: ${dir};
    }
    .doc-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #1a56db;
    }
    .doc-header h1 {
      font-size: 22px;
      color: #1a56db;
      margin-bottom: 4px;
    }
    .doc-header .doc-date {
      font-size: 11px;
      color: #6b7280;
    }
    h2 {
      font-size: 15px;
      margin: 24px 0 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    section { margin-bottom: 16px; }
    p { margin-bottom: 8px; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { border: 1px solid #d1d5db; padding: 8px 12px; text-align: start; }
    th { background: #f3f4f6; font-weight: 600; }
    .signature-block {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
      page-break-inside: avoid;
    }
    .signature-party {
      flex: 1;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #1a1a1a;
      width: 100%;
      display: block;
      margin-top: 60px;
      margin-bottom: 4px;
    }
    .signature-label { font-size: 12px; color: #6b7280; }
    .date { color: #6b7280; font-size: 11px; }
    .doc-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="doc-header">
  <h1>${escapeHtml(title)}</h1>
  <div class="doc-date">${new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-IL' : locale === 'ru' ? 'ru-RU' : 'en-US')}</div>
</div>
${content}
<div class="doc-footer">LegAIDoc &mdash; ${locale === 'he' || locale === 'ar' ? 'מסמך זה נוצר באמצעות LegAIDoc' : 'Generated with LegAIDoc'}</div>
</body>
</html>`;
}
