'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import {
  TemplateDefinition,
  type TemplateDefinitionV1Type,
  type TemplateDefinitionV2Type,
  type TemplateDefinitionType,
} from '@/schemas/template-definition';
import { MetadataSection } from './metadata-section';
import { StepsSection } from './steps-section';
import { DocumentBodySection } from './document-body-section';
import { SectionsEditor } from './sections-editor';
import { AiSyncButton } from './ai-sync-button';

export interface CategoryOption {
  id: string;
  nameEn: string;
  nameHe: string;
  nameAr: string;
  nameRu: string;
}

export interface TemplateData {
  id: string;
  slug: string;
  nameHe: string;
  nameAr: string;
  nameEn: string;
  nameRu: string;
  descHe: string;
  descAr: string;
  descEn: string;
  descRu: string;
  categoryId: string;
  definition: unknown;
  version: number;
  isActive: boolean;
}

interface TemplateEditorProps {
  template: TemplateData;
  categories: CategoryOption[];
}

interface MetadataState {
  slug: string;
  nameHe: string;
  nameAr: string;
  nameEn: string;
  nameRu: string;
  descHe: string;
  descAr: string;
  descEn: string;
  descRu: string;
  categoryId: string;
  isActive: boolean;
}

function parseDefinition(raw: unknown): TemplateDefinitionType {
  const result = TemplateDefinition.safeParse(raw);
  if (result.success) return result.data;
  // Fallback to a minimal v1 definition
  return {
    version: 1 as const,
    steps: [{ key: 'step_1', title: { he: '', ar: '', en: 'Step 1', ru: '' }, fields: [] }],
    documentBody: { he: '', ar: '', en: '', ru: '' },
  };
}

export function TemplateEditor({ template, categories }: TemplateEditorProps) {
  const t = useTranslations('templateEditor');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Metadata state
  const [metadata, setMetadata] = useState<MetadataState>({
    slug: template.slug,
    nameHe: template.nameHe,
    nameAr: template.nameAr,
    nameEn: template.nameEn,
    nameRu: template.nameRu,
    descHe: template.descHe,
    descAr: template.descAr,
    descEn: template.descEn,
    descRu: template.descRu,
    categoryId: template.categoryId,
    isActive: template.isActive,
  });

  // Definition state (deeply nested, managed separately from RHF)
  const [definition, setDefinition] = useState<TemplateDefinitionType>(() =>
    parseDefinition(template.definition),
  );

  // Track dirty state for unsaved changes warning
  const [initialSnapshot] = useState(() => JSON.stringify({ metadata, definition }));
  const isDirty = useMemo(
    () => JSON.stringify({ metadata, definition }) !== initialSnapshot,
    [metadata, definition, initialSnapshot],
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Compute all field keys for reference panels + condition selectors
  const allFieldKeys = useMemo(
    () =>
      definition.steps.flatMap((step) =>
        step.fields.map((f) => ({
          key: f.key,
          label: f.label.en,
          type: f.type,
          stepKey: step.key,
        })),
      ),
    [definition],
  );

  // Version toggle
  const handleVersionChange = useCallback(
    (value: string) => {
      const newVersion = Number(value) as 1 | 2;
      if (newVersion === definition.version) return;

      if (!window.confirm(t('versionSwitchWarning'))) return;

      if (newVersion === 2) {
        setDefinition({
          version: 2 as const,
          steps: definition.steps,
          sections: [],
        });
      } else {
        setDefinition({
          version: 1 as const,
          steps: definition.steps,
          documentBody: { he: '', ar: '', en: '', ru: '' },
        });
      }
    },
    [definition, t],
  );

  // AI Sync handler: merge translated data from AI
  const handleAiSync = useCallback(
    (metaPatch: Partial<MetadataState>, translatedDefinition: TemplateDefinitionType) => {
      setMetadata((prev) => ({ ...prev, ...metaPatch }));
      setDefinition(translatedDefinition);
      toast.success(t('syncSuccess'));
    },
    [t],
  );

  // Save handler
  async function handleSave() {
    setValidationErrors([]);

    // Validate definition
    const defResult = TemplateDefinition.safeParse(definition);
    if (!defResult.success) {
      const errors = defResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      setValidationErrors(errors);
      toast.error(t('saveFailed'));
      return;
    }

    // Validate metadata basics
    if (!metadata.slug || !metadata.nameEn || !metadata.nameHe || !metadata.categoryId) {
      setValidationErrors(['Slug, English name, Hebrew name, and category are required.']);
      toast.error(t('saveFailed'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metadata,
          definition: defResult.data,
        }),
      });

      if (res.ok) {
        toast.success(t('saved'));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || t('saveFailed'));
      }
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={'/admin/templates' as string & {}}>
              <ArrowLeft className="h-4 w-4" />
              {t('backToList')}
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{template.nameHe || template.nameEn}</h1>
          <Badge variant="outline">v{template.version}</Badge>
          {isDirty && (
            <Badge variant="secondary" className="text-yellow-600">
              {t('unsavedChanges')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AiSyncButton metadata={metadata} definition={definition} onSync={handleAiSync} />
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive mb-2 text-sm font-medium">{t('validationErrors')}:</p>
            <ul className="text-destructive space-y-1 text-sm">
              {validationErrors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <MetadataSection metadata={metadata} onChange={setMetadata} categories={categories} />

      {/* Definition version toggle */}
      <Card>
        <CardHeader>
          <CardTitle>{t('definitionVersion')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={String(definition.version)}
            onValueChange={handleVersionChange}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="v1" />
              <Label htmlFor="v1">{t('v1Label')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="v2" />
              <Label htmlFor="v2">{t('v2Label')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Steps editor (shared between v1/v2) */}
      <StepsSection definition={definition} onChange={setDefinition} />

      {/* Document body (v1) or Sections (v2) */}
      {definition.version === 1 ? (
        <DocumentBodySection
          definition={definition as TemplateDefinitionV1Type}
          onChange={(def) => setDefinition(def)}
          allFieldKeys={allFieldKeys}
        />
      ) : (
        <SectionsEditor
          definition={definition as TemplateDefinitionV2Type}
          onChange={(def) => setDefinition(def)}
          allFieldKeys={allFieldKeys}
        />
      )}

      {/* Bottom save button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
