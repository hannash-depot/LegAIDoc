'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { TemplateSectionType, FieldType } from '@/schemas/template-definition';
import { LocalizedInput } from './localized-input';

interface FieldKeyInfo {
  key: string;
  label: string;
  type: string;
  stepKey: string;
}

interface SectionCardProps {
  section: TemplateSectionType;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  allFieldKeys: FieldKeyInfo[];
  onUpdate: (section: TemplateSectionType) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const LANGS = ['he', 'ar', 'en', 'ru'] as const;
const LANG_LABELS: Record<string, string> = { he: 'HE', ar: 'AR', en: 'EN', ru: 'RU' };

export function SectionCard({
  section,
  index,
  isFirst,
  isLast,
  allFieldKeys,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const t = useTranslations('templateEditor');
  const [expanded, setExpanded] = useState(false);

  function updateBody(lang: 'he' | 'ar' | 'en' | 'ru', value: string) {
    onUpdate({ ...section, body: { ...section.body, [lang]: value } });
  }

  function addParameter() {
    onUpdate({
      ...section,
      parameters: [
        ...section.parameters,
        { placeholder: '', fieldKey: '', type: 'text' as FieldType },
      ],
    });
  }

  function updateParameter(
    i: number,
    patch: { placeholder?: string; fieldKey?: string; type?: FieldType },
  ) {
    const next = [...section.parameters];
    next[i] = { ...next[i], ...patch };

    // Auto-fill type from field key
    if (patch.fieldKey) {
      const matched = allFieldKeys.find((f) => f.key === patch.fieldKey);
      if (matched) {
        next[i] = { ...next[i], type: matched.type as FieldType };
      }
    }

    onUpdate({ ...section, parameters: next });
  }

  function removeParameter(i: number) {
    onUpdate({
      ...section,
      parameters: section.parameters.filter((_, idx) => idx !== i),
    });
  }

  function updateCondition(field: string, operator: string, value: string) {
    if (!field && !operator) {
      // Remove condition
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { condition: _condition, ...rest } = section;
      onUpdate(rest as TemplateSectionType);
    } else {
      onUpdate({
        ...section,
        condition: {
          field,
          operator: operator as 'equals' | 'not_equals' | 'is_truthy' | 'is_falsy',
          ...(value && (operator === 'equals' || operator === 'not_equals') ? { value } : {}),
        },
      });
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {index + 1}
            </Badge>
            <span className="font-medium">
              {section.title.he || section.title.en || `Section ${index + 1}`}
            </span>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={isFirst}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={isLast}>
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="text-destructive h-3 w-3" />
            </Button>
            {expanded ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Section title: Hebrew-first */}
          <LocalizedInput
            label={t('sectionTitle')}
            value={section.title}
            onChange={(title) => onUpdate({ ...section, title })}
          />

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label>{t('sectionSortOrder')}</Label>
            <Input
              type="number"
              value={section.sortOrder}
              onChange={(e) => onUpdate({ ...section, sortOrder: Number(e.target.value) || 0 })}
              className="max-w-[100px]"
            />
          </div>

          {/* Section body: Tabs for languages */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('sectionBody')}</Label>
            <Tabs defaultValue="he">
              <TabsList>
                {LANGS.map((lang) => (
                  <TabsTrigger key={lang} value={lang} className="gap-1.5">
                    {LANG_LABELS[lang]}
                    {section.body[lang]?.trim() ? (
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
                    value={section.body[lang]}
                    onChange={(e) => updateBody(lang, e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                    dir={lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}
                    placeholder={`Section body with {{placeholder}} tokens...`}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Parameter bindings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t('sectionParameters')}</Label>
              <Button variant="outline" size="sm" onClick={addParameter}>
                <Plus className="h-3 w-3" />
                {t('addParameter')}
              </Button>
            </div>
            {section.parameters.length > 0 && (
              <div className="space-y-2">
                {section.parameters.map((param, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-md border p-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t('paramPlaceholder')}</Label>
                      <Input
                        value={param.placeholder}
                        onChange={(e) =>
                          updateParameter(i, {
                            placeholder: e.target.value,
                          })
                        }
                        className="font-mono text-xs"
                        dir="ltr"
                        placeholder="field_key"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t('paramFieldKey')}</Label>
                      <Select
                        value={param.fieldKey}
                        onValueChange={(v) => updateParameter(i, { fieldKey: v })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {allFieldKeys.map((f) => (
                            <SelectItem key={f.key} value={f.key}>
                              {f.key} ({f.label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">{t('paramType')}</Label>
                      <Input value={param.type} readOnly className="text-xs" dir="ltr" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeParameter(i)}>
                      <Trash2 className="text-destructive h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section condition */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('sectionCondition')}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('conditionField')}</Label>
                <Input
                  value={section.condition?.field ?? ''}
                  onChange={(e) =>
                    updateCondition(
                      e.target.value,
                      section.condition?.operator ?? '',
                      String(section.condition?.value ?? ''),
                    )
                  }
                  placeholder="field_key"
                  className="font-mono text-xs"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('conditionOperator')}</Label>
                <Select
                  value={section.condition?.operator ?? ''}
                  onValueChange={(v) =>
                    updateCondition(
                      section.condition?.field ?? '',
                      v,
                      String(section.condition?.value ?? ''),
                    )
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">not_equals</SelectItem>
                    <SelectItem value="is_truthy">is_truthy</SelectItem>
                    <SelectItem value="is_falsy">is_falsy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(section.condition?.operator === 'equals' ||
                section.condition?.operator === 'not_equals') && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">{t('conditionValue')}</Label>
                  <Input
                    value={String(section.condition?.value ?? '')}
                    onChange={(e) =>
                      updateCondition(
                        section.condition?.field ?? '',
                        section.condition?.operator ?? '',
                        e.target.value,
                      )
                    }
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
