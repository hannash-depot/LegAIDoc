'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { TemplateDefinitionV2Type, TemplateSectionType } from '@/schemas/template-definition';
import { SectionCard } from './section-card';

interface FieldKeyInfo {
  key: string;
  label: string;
  type: string;
  stepKey: string;
}

interface SectionsEditorProps {
  definition: TemplateDefinitionV2Type;
  onChange: (def: TemplateDefinitionV2Type) => void;
  allFieldKeys: FieldKeyInfo[];
}

export function SectionsEditor({ definition, onChange, allFieldKeys }: SectionsEditorProps) {
  const t = useTranslations('templateEditor');

  function updateSections(newSections: TemplateSectionType[]) {
    onChange({ ...definition, sections: newSections });
  }

  function addSection() {
    const newSection: TemplateSectionType = {
      title: { he: '', ar: '', en: 'New Section', ru: '' },
      body: { he: '', ar: '', en: '', ru: '' },
      sortOrder: definition.sections.length,
      parameters: [],
    };
    updateSections([...definition.sections, newSection]);
  }

  function updateSection(index: number, section: TemplateSectionType) {
    const next = [...definition.sections];
    next[index] = section;
    updateSections(next);
  }

  function removeSection(index: number) {
    if (!window.confirm(t('removeSectionConfirm'))) return;
    updateSections(definition.sections.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= definition.sections.length) return;
    const next = [...definition.sections];
    [next[index], next[target]] = [next[target], next[index]];
    // Update sortOrder
    next.forEach((s, i) => {
      next[i] = { ...s, sortOrder: i };
    });
    updateSections(next);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('sections')}</CardTitle>
        <Button variant="outline" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4" />
          {t('addSection')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {definition.sections.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No sections yet. Add a section to define the document structure.
          </p>
        ) : (
          definition.sections.map((section, index) => (
            <SectionCard
              key={index}
              section={section}
              index={index}
              isFirst={index === 0}
              isLast={index === definition.sections.length - 1}
              allFieldKeys={allFieldKeys}
              onUpdate={(updated) => updateSection(index, updated)}
              onRemove={() => removeSection(index)}
              onMoveUp={() => moveSection(index, -1)}
              onMoveDown={() => moveSection(index, 1)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
