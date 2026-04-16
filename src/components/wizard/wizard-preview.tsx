'use client';

import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { TemplateDefinitionV1Type } from '@/schemas/template-definition';
import { renderTemplate } from '@/lib/templates/renderer';
import type { Locale } from '@/lib/utils/locale';
import { Eye } from 'lucide-react';
import { useAiExplainer } from '@/components/ui/ai-explainer-popup';

interface WizardPreviewProps {
  definition: TemplateDefinitionV1Type;
  wizardData: Record<string, unknown>;
  locale: string;
  templateName?: string;
}

/**
 * WIZD-07: Shows rendered HTML preview of the contract before submission.
 * Styled to look like an A4 paper document.
 */
export function WizardPreview({
  definition,
  wizardData,
  locale,
  templateName,
}: WizardPreviewProps) {
  const t = useTranslations('wizard');
  const isRtl = locale === 'he' || locale === 'ar';

  const renderedHtml = useMemo(
    () => renderTemplate(definition, wizardData, locale as Locale),
    [definition, wizardData, locale],
  );

  const dateStr = new Date().toLocaleDateString(
    locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-IL' : locale === 'ru' ? 'ru-RU' : 'en-US',
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const { onMouseUp, popupElement } = useAiExplainer({ locale, containerRef });

  return (
    <div className="border-border/50 bg-muted/30 overflow-hidden rounded-xl border">
      {/* Preview header bar */}
      <div className="bg-card border-border/50 flex items-center gap-2 border-b px-4 py-2.5">
        <Eye className="text-muted-foreground h-4 w-4" />
        <span className="text-sm font-medium">{t('previewTitle')}</span>
        <span className="text-muted-foreground ms-auto text-xs">{t('previewSubtitle')}</span>
      </div>

      {/* Scrollable paper area */}
      <div
        className="relative max-h-[calc(100vh-10rem)] overflow-y-auto p-4"
        ref={containerRef}
        onMouseUp={onMouseUp}
      >
        {/* AI Explainer Popup */}
        {popupElement}

        {/* A4 Paper */}
        <div
          className="document-preview border-border/20 mx-auto rounded-sm border bg-white shadow-lg dark:bg-slate-950"
          style={{
            maxWidth: '210mm',
            minHeight: '400px',
            padding: '24px 20px',
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
          onCopy={(e) => e.preventDefault()}
        >
          {/* Document header */}
          {templateName && (
            <div className="mb-6 border-b-2 border-blue-600 pb-3 text-center">
              <h1 className="mb-1 text-lg font-bold text-blue-600">{templateName}</h1>
              <div className="text-xs text-gray-500">{dateStr}</div>
            </div>
          )}

          {/* Rendered contract body */}
          <div
            className="text-sm leading-relaxed text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
