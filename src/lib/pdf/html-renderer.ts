import { renderDocument } from "@/lib/templates/engine";
import { getDirection, type Locale } from "@/lib/i18n/routing";
import type { TemplateDefinition } from "@/types/template";

export function renderContractHtml(
  definition: TemplateDefinition,
  data: Record<string, unknown>,
  locale: Locale
): string {
  const direction = getDirection(locale);
  const sections = definition.documentBody[locale] ?? definition.documentBody.he ?? [];
  const contractHtml = renderDocument(sections, data, "______", {
    definition,
    locale,
  });

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Inter:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: ${direction === "rtl" ? "'Noto Sans Hebrew', 'Noto Sans Arabic'" : "'Inter'"}, sans-serif;
      font-size: 13px;
      line-height: 1.8;
      color: #1a1a1a;
      padding: 40px 50px;
      direction: ${direction};
    }

    .contract-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #111;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }

    p {
      margin-bottom: 8px;
      text-align: justify;
    }

    strong { font-weight: 700; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
    }

    td {
      padding: 8px;
      vertical-align: bottom;
    }

    .unfilled {
      background-color: #fef3c7;
      padding: 2px 6px;
      border-radius: 2px;
      color: #92400e;
    }

    .contract-disclaimer {
      font-size: 11px;
      color: #6b7280;
      font-style: italic;
      margin-bottom: 20px;
      padding: 12px;
      background: #f9fafb;
      border-left: 3px solid #9ca3af;
      border-radius: 0 4px 4px 0;
    }

    @page {
      size: A4;
      margin: 20mm;
    }

    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${contractHtml}
</body>
</html>`;
}
