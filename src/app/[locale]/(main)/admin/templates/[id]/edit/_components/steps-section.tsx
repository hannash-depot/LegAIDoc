'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { TemplateDefinitionType, TemplateStepType } from '@/schemas/template-definition';
import { StepCard } from './step-card';

interface StepsSectionProps {
  definition: TemplateDefinitionType;
  onChange: (def: TemplateDefinitionType) => void;
}

export function StepsSection({ definition, onChange }: StepsSectionProps) {
  const t = useTranslations('templateEditor');

  function updateSteps(newSteps: TemplateStepType[]) {
    onChange({ ...definition, steps: newSteps } as TemplateDefinitionType);
  }

  function addStep() {
    const key = `step_${Date.now()}`;
    const newStep: TemplateStepType = {
      key,
      title: { he: '', ar: '', en: 'New Step', ru: '' },
      fields: [],
    };
    updateSteps([...definition.steps, newStep]);
  }

  function updateStep(index: number, step: TemplateStepType) {
    const next = [...definition.steps];
    next[index] = step;
    updateSteps(next);
  }

  function removeStep(index: number) {
    if (!window.confirm(t('removeStepConfirm'))) return;
    updateSteps(definition.steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= definition.steps.length) return;
    const next = [...definition.steps];
    [next[index], next[target]] = [next[target], next[index]];
    updateSteps(next);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('steps')}</CardTitle>
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="h-4 w-4" />
          {t('addStep')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {definition.steps.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t('noFields')}</p>
        ) : (
          definition.steps.map((step, index) => (
            <StepCard
              key={step.key}
              step={step}
              index={index}
              isFirst={index === 0}
              isLast={index === definition.steps.length - 1}
              allSteps={definition.steps}
              onUpdate={(updated) => updateStep(index, updated)}
              onRemove={() => removeStep(index)}
              onMoveUp={() => moveStep(index, -1)}
              onMoveDown={() => moveStep(index, 1)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
