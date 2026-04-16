'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type { LocalizedStringType } from '@/schemas/template-definition';

interface LocalizedInputProps {
  value: LocalizedStringType;
  onChange: (value: LocalizedStringType) => void;
  label: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}

const SECONDARY_LANGS = ['ar', 'en', 'ru'] as const;

const LANG_LABELS: Record<string, string> = {
  he: 'HE',
  ar: 'AR',
  en: 'EN',
  ru: 'RU',
};

function TranslationDot({ value }: { value: LocalizedStringType }) {
  const filled = SECONDARY_LANGS.filter((l) => value[l]?.trim()).length;
  if (filled === 0) return <span className="inline-block h-2 w-2 rounded-full bg-red-400" />;
  if (filled < 3) return <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-green-400" />;
}

export function LocalizedInput({
  value,
  onChange,
  label,
  multiline = false,
  rows = 3,
  placeholder,
  className,
}: LocalizedInputProps) {
  const t = useTranslations('templateEditor');
  const [open, setOpen] = useState(false);

  function update(lang: keyof LocalizedStringType, val: string) {
    onChange({ ...value, [lang]: val });
  }

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-2">
        <Label>{label}</Label>
        <TranslationDot value={value} />
      </div>

      {/* Primary: Hebrew */}
      <InputComponent
        value={value.he}
        onChange={(e) => update('he', e.target.value)}
        dir="rtl"
        placeholder={placeholder}
        {...(multiline ? { rows, className: 'font-mono text-sm' } : {})}
      />

      {/* Secondary languages */}
      <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs">
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          {t('otherLanguages')}
          <span className="flex gap-1">
            {SECONDARY_LANGS.map((lang) => (
              <span
                key={lang}
                className={`rounded px-1 py-0.5 text-[10px] font-medium ${
                  value[lang]?.trim()
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {LANG_LABELS[lang]}
              </span>
            ))}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {SECONDARY_LANGS.map((lang) => (
            <div key={lang} className="space-y-1">
              <Label className="text-muted-foreground text-xs">{LANG_LABELS[lang]}</Label>
              <InputComponent
                value={value[lang]}
                onChange={(e) => update(lang, e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                {...(multiline ? { rows, className: 'font-mono text-sm' } : {})}
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
