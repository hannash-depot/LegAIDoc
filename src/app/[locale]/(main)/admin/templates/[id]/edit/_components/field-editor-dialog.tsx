'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type {
  TemplateFieldType,
  LocalizedStringType,
  FieldType,
} from '@/schemas/template-definition';

const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'date',
  'number',
  'currency',
  'email',
  'phone',
  'id-number',
  'select',
  'radio',
  'multi-select',
  'checkbox',
];

const OPTION_TYPES = new Set(['select', 'radio', 'multi-select']);

const emptyLocalized = (): LocalizedStringType => ({ he: '', ar: '', en: '', ru: '' });

const SECONDARY_LANGS = ['ar', 'en', 'ru'] as const;
const LANG_LABELS: Record<string, string> = { he: 'HE', ar: 'AR', en: 'EN', ru: 'RU' };

interface FieldOption {
  value: string;
  label: LocalizedStringType;
}

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: TemplateFieldType | null;
  existingKeys: string[];
  onSave: (field: TemplateFieldType) => void;
}

/** Inline Hebrew-first localized input for the dialog */
function DialogLocalizedInput({
  label: fieldLabel,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedStringType;
  onChange: (val: LocalizedStringType) => void;
}) {
  const t = useTranslations('templateEditor');
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{fieldLabel} (HE)</Label>
      <Input
        value={value.he}
        onChange={(e) => onChange({ ...value, he: e.target.value })}
        dir="rtl"
      />
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]">
          <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          {t('otherLanguages')}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1.5 space-y-1.5">
          {SECONDARY_LANGS.map((lang) => (
            <div key={lang}>
              <Label className="text-muted-foreground text-[10px]">{LANG_LABELS[lang]}</Label>
              <Input
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function FieldEditorDialog({
  open,
  onOpenChange,
  field,
  existingKeys,
  onSave,
}: FieldEditorDialogProps) {
  const t = useTranslations('templateEditor');
  const tCommon = useTranslations('common');

  // Local state for the field being edited
  const [key, setKey] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(true);
  const [width, setWidth] = useState<'full' | 'half'>('full');
  const [label, setLabel] = useState<LocalizedStringType>(emptyLocalized());
  const [placeholder, setPlaceholder] = useState<LocalizedStringType>(emptyLocalized());
  const [options, setOptions] = useState<FieldOption[]>([]);

  // Validation
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [pattern, setPattern] = useState('');
  const [patternError, setPatternError] = useState<LocalizedStringType>(emptyLocalized());

  // Condition
  const [condField, setCondField] = useState('');
  const [condOperator, setCondOperator] = useState('');
  const [condValue, setCondValue] = useState('');

  const [keyError, setKeyError] = useState('');

  // Reset state when dialog opens with a field (edit) or null (add)
  useEffect(() => {
    if (open) {
      if (field) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setKey(field.key);
        setType(field.type);
        setRequired(field.required);
        setWidth(field.width);
        setLabel({ ...field.label });
        setPlaceholder(field.placeholder ? { ...field.placeholder } : emptyLocalized());
        setOptions(
          field.options
            ? field.options.map((o) => ({ value: o.value, label: { ...o.label } }))
            : [],
        );
        setMinLength(field.validation?.minLength?.toString() ?? '');
        setMaxLength(field.validation?.maxLength?.toString() ?? '');
        setMinValue(field.validation?.min?.toString() ?? '');
        setMaxValue(field.validation?.max?.toString() ?? '');
        setPattern(field.validation?.pattern ?? '');
        setPatternError(
          field.validation?.patternError ? { ...field.validation.patternError } : emptyLocalized(),
        );
        setCondField(field.condition?.field ?? '');
        setCondOperator(field.condition?.operator ?? '');
        setCondValue(String(field.condition?.value ?? ''));
      } else {
        // New field defaults
        setKey('');
        setType('text');
        setRequired(true);
        setWidth('full');
        setLabel(emptyLocalized());
        setPlaceholder(emptyLocalized());
        setOptions([]);
        setMinLength('');
        setMaxLength('');
        setMinValue('');
        setMaxValue('');
        setPattern('');
        setPatternError(emptyLocalized());
        setCondField('');
        setCondOperator('');
        setCondValue('');
      }
      setKeyError('');
    }
  }, [open, field]);

  // Clear options when switching away from option-based types
  useEffect(() => {
    if (!OPTION_TYPES.has(type)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions([]);
    }
  }, [type]);

  function addOption() {
    setOptions([...options, { value: '', label: emptyLocalized() }]);
  }

  function updateOption(index: number, patch: Partial<FieldOption>) {
    const next = [...options];
    next[index] = { ...next[index], ...patch };
    setOptions(next);
  }

  function updateOptionLabel(index: number, lang: keyof LocalizedStringType, value: string) {
    const next = [...options];
    next[index] = { ...next[index], label: { ...next[index].label, [lang]: value } };
    setOptions(next);
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  function handleSave() {
    // Validate key
    if (!key.trim()) {
      setKeyError('Field key is required');
      return;
    }
    if (existingKeys.includes(key.trim())) {
      setKeyError('This key already exists. Field keys must be unique.');
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(key.trim())) {
      setKeyError('Key must be lowercase letters, numbers, and underscores');
      return;
    }

    // Build validation object
    const validation: Record<string, unknown> = {};
    if (minLength) validation.minLength = Number(minLength);
    if (maxLength) validation.maxLength = Number(maxLength);
    if (minValue) validation.min = Number(minValue);
    if (maxValue) validation.max = Number(maxValue);
    if (pattern) {
      validation.pattern = pattern;
      const hasPatternError = Object.values(patternError).some((v) => v.trim());
      if (hasPatternError) validation.patternError = patternError;
    }

    // Build condition object
    let condition: TemplateFieldType['condition'] = undefined;
    if (condField && condOperator) {
      condition = {
        field: condField,
        operator: condOperator as 'equals' | 'not_equals' | 'is_truthy' | 'is_falsy',
        ...(condValue && (condOperator === 'equals' || condOperator === 'not_equals')
          ? { value: condValue }
          : {}),
      };
    }

    // Check if placeholder has any content
    const hasPlaceholder = Object.values(placeholder).some((v) => v.trim());

    const result: TemplateFieldType = {
      key: key.trim(),
      type,
      label,
      required,
      width,
      ...(hasPlaceholder ? { placeholder } : {}),
      ...(Object.keys(validation).length > 0 ? { validation } : {}),
      ...(OPTION_TYPES.has(type) && options.length > 0 ? { options } : {}),
      ...(condition ? { condition } : {}),
    };

    onSave(result);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{field ? t('editField') : t('addField')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t('fieldKey')}</Label>
              <Input
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setKeyError('');
                }}
                placeholder="field_key"
                className="font-mono"
                dir="ltr"
              />
              {keyError && <p className="text-destructive text-xs">{keyError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('fieldType')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {ft}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('fieldWidth')}</Label>
              <RadioGroup
                value={width}
                onValueChange={(v) => setWidth(v as 'full' | 'half')}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="full" id="w-full" />
                  <Label htmlFor="w-full" className="text-xs">
                    {t('widthFull')}
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="half" id="w-half" />
                  <Label htmlFor="w-half" className="text-xs">
                    {t('widthHalf')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Required toggle */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch id="field-required" checked={required} onCheckedChange={setRequired} />
            <Label htmlFor="field-required">
              {required ? t('fieldRequired') : t('fieldOptional')}
            </Label>
          </div>

          {/* Labels: Hebrew-first */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('fieldLabels')}</Label>
            <DialogLocalizedInput label={t('fieldLabels')} value={label} onChange={setLabel} />
          </div>

          {/* Placeholders: Hebrew-first */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('fieldPlaceholders')}</Label>
            <DialogLocalizedInput
              label={t('fieldPlaceholders')}
              value={placeholder}
              onChange={setPlaceholder}
            />
          </div>

          {/* Validation rules */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('fieldValidation')}</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('minLength')}</Label>
                <Input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('maxLength')}</Label>
                <Input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('minValue')}</Label>
                <Input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('maxValue')}</Label>
                <Input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">{t('pattern')}</Label>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="^[0-9]+$"
                className="font-mono"
                dir="ltr"
              />
            </div>
            {pattern && (
              <DialogLocalizedInput
                label={t('patternError')}
                value={patternError}
                onChange={setPatternError}
              />
            )}
          </div>

          {/* Options (for select/radio/multi-select) */}
          {OPTION_TYPES.has(type) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{t('fieldOptions')}</Label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-3 w-3" />
                  {t('addOption')}
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border p-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('optionValue')}</Label>
                      <Input
                        value={opt.value}
                        onChange={(e) => updateOption(i, { value: e.target.value })}
                        className="w-24 font-mono text-xs"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">HE</Label>
                      <Input
                        value={opt.label.he}
                        onChange={(e) => updateOptionLabel(i, 'he', e.target.value)}
                        className="text-xs"
                        dir="rtl"
                      />
                      <Collapsible className="mt-1">
                        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]">
                          <ChevronDown className="h-2.5 w-2.5" />
                          AR / EN / RU
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1 space-y-1">
                          {SECONDARY_LANGS.map((lang) => (
                            <div key={lang}>
                              <Label className="text-muted-foreground text-[10px]">
                                {LANG_LABELS[lang]}
                              </Label>
                              <Input
                                value={opt.label[lang]}
                                onChange={(e) => updateOptionLabel(i, lang, e.target.value)}
                                className="h-7 text-xs"
                                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                              />
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-5"
                      onClick={() => removeOption(i)}
                    >
                      <Trash2 className="text-destructive h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional visibility */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('fieldCondition')}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('conditionField')}</Label>
                <Input
                  value={condField}
                  onChange={(e) => setCondField(e.target.value)}
                  placeholder="other_field_key"
                  className="font-mono text-xs"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">{t('conditionOperator')}</Label>
                <Select value={condOperator} onValueChange={setCondOperator}>
                  <SelectTrigger>
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
              {(condOperator === 'equals' || condOperator === 'not_equals') && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">{t('conditionValue')}</Label>
                  <Input
                    value={condValue}
                    onChange={(e) => setCondValue(e.target.value)}
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSave}>{tCommon('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
