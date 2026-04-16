'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface AiExplainerPopupProps {
  locale: string;
  /** The container ref that the popup positions relative to */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Reusable AI legal text explainer popup.
 * Attach to any container with legal text — users select text and get
 * a plain-language explanation via the LLM-powered /api/documents/explain endpoint.
 *
 * Returns event handlers and the popup JSX to render inside the container.
 */
export function useAiExplainer({ locale, containerRef }: AiExplainerPopupProps) {
  const t = useTranslations('wizard');
  const isRtl = locale === 'he' || locale === 'ar';

  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 5 || !containerRef.current) {
      if (!popupPosition) setSelectedText('');
      return;
    }

    const range = selection?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setPopupPosition({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2 - 50,
    });
    setSelectedText(text);
    setExplanation(null);
    setExplainError(null);
  }, [containerRef, popupPosition]);

  const handleClosePopup = useCallback(() => {
    setPopupPosition(null);
    setSelectedText('');
    setExplanation(null);
    setExplainError(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupPosition &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClosePopup();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popupPosition) {
        handleClosePopup();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popupPosition, containerRef, handleClosePopup]);

  const handleExplain = useCallback(async () => {
    if (!selectedText) return;
    setIsExplaining(true);
    setExplainError(null);
    try {
      const res = await fetch('/api/documents/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error?.message || 'Failed to fetch explanation');
      setExplanation(data.data.explanation);
    } catch (err: unknown) {
      setExplainError(err instanceof Error ? err.message : 'An error occurred while explaining.');
    } finally {
      setIsExplaining(false);
    }
  }, [selectedText, locale]);

  const popupElement =
    popupPosition && selectedText ? (
      <div
        role="dialog"
        aria-label={t('explainerTitle')}
        className="bg-popover text-popover-foreground border-border absolute z-50 max-w-[320px] min-w-[280px] rounded-lg border p-3 shadow-xl transition-all"
        style={{
          top: Math.max(0, popupPosition.top),
          left: Math.min(
            Math.max(0, popupPosition.left),
            containerRef.current?.clientWidth
              ? containerRef.current.clientWidth - 300
              : popupPosition.left,
          ),
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-primary flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t('explainerTitle')}
          </div>
          <button
            onClick={handleClosePopup}
            aria-label={t('close') || 'Close'}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!explanation && !isExplaining && !explainError && (
          <button
            onClick={handleExplain}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-1 rounded py-1.5 text-xs font-medium transition-colors"
          >
            {t('explainerAction')}
          </button>
        )}

        {isExplaining && (
          <div
            className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-xs"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('explainerLoading')}
          </div>
        )}

        {explanation && (
          <div
            className="max-h-[200px] overflow-y-auto text-sm leading-relaxed"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {explanation}
          </div>
        )}

        {explainError && <div className="text-destructive py-1 text-xs">{explainError}</div>}
      </div>
    ) : null;

  return {
    onMouseUp: handleMouseUp,
    popupElement,
  };
}
