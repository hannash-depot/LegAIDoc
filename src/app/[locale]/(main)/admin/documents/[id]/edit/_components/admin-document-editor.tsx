'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, User, FileText, Calendar } from 'lucide-react';
import { WizardFieldRenderer } from '@/components/wizard/wizard-field-renderer';
import { WizardPreview } from '@/components/wizard/wizard-preview';
import type { TemplateDefinitionV1Type, TemplateFieldType } from '@/schemas/template-definition';
import type { CategoryLegalRules } from '@/schemas/legal-rules';
import { getProhibitedFieldKeys } from '@/lib/legal/legal-validators';
import { formatDistanceToNow } from 'date-fns';

const DOCUMENT_STATUSES = [
  'DRAFT',
  'PENDING_SIGNATURE',
  'PUBLISHED',
  'SIGNED',
  'ARCHIVED',
] as const;

interface DocumentData {
  id: string;
  title: string;
  status: string;
  locale: string;
  wizardData: Record<string, unknown>;
  renderedBody: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  template: {
    id: string;
    nameEn: string;
    nameHe: string;
    nameAr: string;
    nameRu: string;
    slug: string;
  };
  signatories: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    signedAt: string | null;
  }>;
}

interface AdminDocumentEditorProps {
  document: DocumentData;
  definition: TemplateDefinitionV1Type;
  templateName: string;
  legalRules: CategoryLegalRules;
}

export function AdminDocumentEditor({
  document: doc,
  definition,
  templateName,
  legalRules,
}: AdminDocumentEditorProps) {
  const t = useTranslations('adminDocumentEditor');
  const tWizard = useTranslations('wizard');
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState(doc.status);
  const [wizardData, setWizardData] = useState<Record<string, unknown>>(doc.wizardData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const steps = definition.steps;
  const step = steps[currentStep];

  const handleChange = useCallback((key: string, value: unknown) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isFieldVisible = useCallback(
    (field: TemplateFieldType): boolean => {
      const prohibitedFields = getProhibitedFieldKeys(legalRules);
      if (prohibitedFields.includes(field.key)) return false;
      if (!field.condition) return true;
      const { field: condField, operator, value } = field.condition;
      const fieldValue = wizardData[condField];
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'is_truthy':
          return !!fieldValue;
        case 'is_falsy':
          return !fieldValue;
        default:
          return true;
      }
    },
    [wizardData, legalRules],
  );

  const visibleFields = step.fields.filter(isFieldVisible);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status,
          wizardData,
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
      {/* Sticky header bar */}
      <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={'/admin/documents' as string & {}}>
              <ArrowLeft className="h-4 w-4" />
              {t('backToList')}
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t('editDocument')}</h1>
          <Badge variant="outline">{doc.status.replace('_', ' ')}</Badge>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>

      {/* Document metadata */}
      <Card>
        <CardHeader>
          <CardTitle>{t('documentInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">{t('title')}</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-status">{t('status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="doc-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {t('owner')}
              </Label>
              <p className="text-sm">{doc.user.name}</p>
              <p className="text-muted-foreground text-xs">{doc.user.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {t('template')}
              </Label>
              <p className="text-sm">{templateName}</p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {doc.signatories.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <Label>{t('signatories')}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {doc.signatories.map((sig) => (
                  <Badge key={sig.id} variant={sig.signedAt ? 'default' : 'secondary'}>
                    {sig.name} ({sig.role}){sig.signedAt && ' ✓'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard data editor */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Step pills */}
          <div className="-mb-2 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {steps.map((s, i) => {
                const isCurrent = i === currentStep;
                const stepTitle = s.title[locale as keyof typeof s.title] || s.title.en;
                return (
                  <button
                    key={s.key}
                    onClick={() => setCurrentStep(i)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent ? 'bg-primary-foreground/20' : 'bg-current/10'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="hidden sm:inline">{stepTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step title */}
          <h2 className="text-xl font-semibold">
            {step.title[locale as keyof typeof step.title] || step.title.en}
          </h2>

          {/* Fields */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <div key={field.key} className={field.width === 'half' ? '' : 'md:col-span-2'}>
                    <WizardFieldRenderer
                      field={field}
                      value={wizardData[field.key]}
                      onChange={handleChange}
                      error={undefined}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              {tWizard('previous') || 'Previous'}
            </Button>
            <span className="text-muted-foreground text-sm">
              {currentStep + 1} / {steps.length}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              {tWizard('next') || 'Next'}
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="sticky top-24 lg:col-span-2">
          <WizardPreview
            definition={definition}
            wizardData={wizardData}
            locale={locale}
            templateName={templateName}
          />
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
