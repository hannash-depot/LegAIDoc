'use client';

import { useState, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { TemplateStepType, TemplateFieldType } from '@/schemas/template-definition';
import { LocalizedInput } from './localized-input';
import { FieldsTable } from './fields-table';

interface StepCardProps {
  step: TemplateStepType;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  allSteps: TemplateStepType[];
  onUpdate: (step: TemplateStepType) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const StepCard = memo(function StepCard({
  step,
  index,
  isFirst,
  isLast,
  allSteps,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StepCardProps) {
  const t = useTranslations('templateEditor');
  const [expanded, setExpanded] = useState(false);

  // Collect all field keys across ALL steps for condition reference
  const allFieldKeys = allSteps.flatMap((s) => s.fields.map((f) => f.key));

  function updateFields(fields: TemplateFieldType[]) {
    onUpdate({ ...step, fields });
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {index + 1}
            </Badge>
            <span className="font-medium">{step.title.he || step.title.en || step.key}</span>
            <Badge variant="secondary" className="text-xs">
              {step.fields.length} {t('fields').toLowerCase()}
            </Badge>
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
          {/* Step key */}
          <div className="space-y-1.5">
            <Label>{t('stepKey')}</Label>
            <Input
              value={step.key}
              onChange={(e) => onUpdate({ ...step, key: e.target.value })}
              className="max-w-xs font-mono"
              dir="ltr"
            />
          </div>

          {/* Title: Hebrew-first with collapsible others */}
          <LocalizedInput
            label={t('sectionTitle')}
            value={step.title}
            onChange={(title) => onUpdate({ ...step, title })}
          />

          {/* Fields table */}
          <FieldsTable fields={step.fields} onUpdate={updateFields} allFieldKeys={allFieldKeys} />
        </CardContent>
      )}
    </Card>
  );
});
