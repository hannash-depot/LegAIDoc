'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { useAiExplainer } from '@/components/ui/ai-explainer-popup';

interface ContractBodyExplainerProps {
  html: string;
  locale: string;
}

/**
 * Renders a contract's HTML body with the AI Explainer feature.
 * Users can select any legal text to get a plain-language explanation.
 */
export function ContractBodyExplainer({ html, locale }: ContractBodyExplainerProps) {
  const t = useTranslations('wizard');
  const containerRef = useRef<HTMLDivElement>(null);
  const { onMouseUp, popupElement } = useAiExplainer({ locale, containerRef });

  return (
    <div className="relative" ref={containerRef} onMouseUp={onMouseUp}>
      {/* AI Explainer Popup */}
      {popupElement}

      {/* Contract HTML */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Hint */}
      <div className="text-muted-foreground mt-4 flex items-center gap-1.5 border-t pt-3 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        {t('explainerHint')}
      </div>
    </div>
  );
}
