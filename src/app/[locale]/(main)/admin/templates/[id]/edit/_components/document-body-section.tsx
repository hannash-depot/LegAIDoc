'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TemplateDefinitionV1Type } from '@/schemas/template-definition';

interface FieldKeyInfo {
  key: string;
  label: string;
  type: string;
  stepKey: string;
}

interface DocumentBodySectionProps {
  definition: TemplateDefinitionV1Type;
  onChange: (def: TemplateDefinitionV1Type) => void;
  allFieldKeys: FieldKeyInfo[];
}

const LANGS = ['he', 'ar', 'en', 'ru'] as const;
const LANG_LABELS: Record<string, string> = { he: 'HE', ar: 'AR', en: 'EN', ru: 'RU' };

export function DocumentBodySection({
  definition,
  onChange,
  allFieldKeys,
}: DocumentBodySectionProps) {
  const t = useTranslations('templateEditor');

  function updateBody(lang: 'he' | 'ar' | 'en' | 'ru', value: string) {
    onChange({
      ...definition,
      documentBody: { ...definition.documentBody, [lang]: value },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('documentBody')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Body textareas with language tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="he">
              <TabsList>
                {LANGS.map((lang) => (
                  <TabsTrigger key={lang} value={lang} className="gap-1.5">
                    {LANG_LABELS[lang]}
                    {definition.documentBody[lang]?.trim() ? (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                    ) : (
                      <span className="bg-muted-foreground/30 inline-block h-1.5 w-1.5 rounded-full" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LANGS.map((lang) => (
                <TabsContent key={lang} value={lang}>
                  <Textarea
                    value={definition.documentBody[lang]}
                    onChange={(e) => updateBody(lang, e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    dir={lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}
                    placeholder={`Document body with {{field_key}} placeholders...`}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Available placeholders reference */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 sticky top-20 rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">{t('availablePlaceholders')}</h4>
              {allFieldKeys.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('noPlaceholders')}</p>
              ) : (
                <div className="space-y-1.5">
                  {allFieldKeys.map((f) => (
                    <div key={f.key} className="text-xs">
                      <code className="bg-background rounded px-1 py-0.5 font-mono">
                        {'{{' + f.key + '}}'}
                      </code>
                      <span className="text-muted-foreground ms-1">{f.label || f.key}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
