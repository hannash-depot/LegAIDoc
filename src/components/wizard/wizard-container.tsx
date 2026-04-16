'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { TemplateDefinitionV1Type, TemplateFieldType } from '@/schemas/template-definition';
import { WizardFieldRenderer } from './wizard-field-renderer';
import { WizardPreview } from './wizard-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check, FileCheck, Info } from 'lucide-react';
import { runLegalValidations, getProhibitedFieldKeys } from '@/lib/legal/legal-validators';
import type { CategoryLegalRules } from '@/schemas/legal-rules';

interface WizardContainerProps {
  templateId: string;
  templateName: string;
  definition: TemplateDefinitionV1Type;
  legalRules: CategoryLegalRules;
  /** When editing an existing document, pass its ID */
  documentId?: string;
  /** Pre-populated wizard data for edit mode */
  initialData?: Record<string, unknown>;
}

export function WizardContainer({
  templateId,
  templateName,
  definition,
  legalRules,
  documentId,
  initialData,
}: WizardContainerProps) {
  const isEditMode = !!documentId;
  const t = useTranslations('wizard');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const isRtl = locale === 'he' || locale === 'ar';
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const [wizardData, setWizardData] = useState<Record<string, unknown>>(initialData ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [legalAcknowledged, setLegalAcknowledged] = useState(isEditMode);

  const steps = definition.steps;
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const handleChange = useCallback((key: string, value: unknown) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // TDEF-07: Evaluate field visibility based on conditions
  const isFieldVisible = useCallback(
    (field: TemplateFieldType): boolean => {
      // LREG-03: Hide prohibited fields
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

  // WIZD-03: Validate current step fields
  const validateStep = (stepIndex?: number): boolean => {
    const targetStep = steps[stepIndex ?? currentStep];
    const newErrors: Record<string, string> = {};
    const visibleFields = targetStep.fields.filter(isFieldVisible);

    for (const field of visibleFields) {
      const value = wizardData[field.key];

      if (field.required) {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[field.key] = t('required');
          continue;
        }
      }

      if (value && field.validation) {
        const strValue = String(value);
        if (field.validation.minLength && strValue.length < field.validation.minLength) {
          newErrors[field.key] = t('minLength', { min: field.validation.minLength });
        }
        if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
          newErrors[field.key] = t('maxLength', { max: field.validation.maxLength });
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(strValue)) {
            const patternError = field.validation.patternError;
            newErrors[field.key] = patternError
              ? patternError[locale as keyof typeof patternError] || patternError.en
              : t('invalidFormat');
          }
        }
      }

      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          newErrors[field.key] = t('invalidEmail');
        }
      }
    }

    setErrors(newErrors);

    // LREG: Run legal validations
    const legalErrors = runLegalValidations(wizardData, legalRules);
    if (Object.keys(legalErrors).length > 0) {
      const translatedLegalErrors: Record<string, string> = {};
      for (const [key, errorKey] of Object.entries(legalErrors)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          translatedLegalErrors[key] = tRoot(errorKey as any);
        } catch {
          translatedLegalErrors[key] = errorKey;
        }
      }
      setErrors((prev) => ({ ...prev, ...translatedLegalErrors }));
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (!isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps((prev) => new Set(prev).add(nextStep));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === currentStep) return;
    // Allow clicking on visited (completed) steps or the next step
    if (stepIndex < currentStep || visitedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
      setVisitedSteps((prev) => new Set(prev).add(stepIndex));
    } else if (stepIndex === currentStep + 1) {
      // Allow going forward one step if current validates
      if (validateStep()) {
        setCurrentStep(stepIndex);
        setVisitedSteps((prev) => new Set(prev).add(stepIndex));
      }
    }
  };

  // WIZD-08: Submit creates document + triggers PDF (or updates in edit mode)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/documents/${documentId}` : '/api/documents';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          wizardData,
          locale,
        }),
      });

      if (res.ok) {
        if (isEditMode) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.push(`/documents/${documentId}` as any);
        } else {
          router.push('/documents');
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error?.message || t('generateFailed'));
      }
    } catch {
      alert(t('unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitWrapper = async () => {
    if (!validateStep()) return;
    await handleSubmit();
  };

  const visibleFields = step.fields.filter(isFieldVisible);

  // Group fields: detect consecutive checkboxes to render them compactly
  const groupedFields = useMemo(() => {
    const groups: Array<
      | { type: 'field'; field: TemplateFieldType }
      | { type: 'checkbox-group'; fields: TemplateFieldType[] }
    > = [];
    let checkboxBuffer: TemplateFieldType[] = [];

    const flushCheckboxes = () => {
      if (checkboxBuffer.length > 0) {
        groups.push({ type: 'checkbox-group', fields: [...checkboxBuffer] });
        checkboxBuffer = [];
      }
    };

    for (const field of visibleFields) {
      if (field.type === 'checkbox' && field.width === 'half') {
        checkboxBuffer.push(field);
      } else {
        flushCheckboxes();
        groups.push({ type: 'field', field });
      }
    }
    flushCheckboxes();

    return groups;
  }, [visibleFields]);

  // Get step description if available
  const stepDescription = step.description
    ? step.description[locale as keyof typeof step.description] || step.description.en
    : null;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
      {/* Left Column: Wizard Form (3/5 width) */}
      <div className="space-y-6 lg:col-span-3">
        {/* Legal acknowledgment banner — shown once before first use */}
        {!legalAcknowledged && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('legalAcknowledgmentTitle')}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('legalAcknowledgment')}
                </p>
                <Button size="sm" onClick={() => setLegalAcknowledged(true)}>
                  {t('legalAcknowledgmentAccept')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step pills navigation */}
        <div className="-mb-2 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {steps.map((s, i) => {
              const isCompleted = i < currentStep || (visitedSteps.has(i) && i < currentStep);
              const isCurrent = i === currentStep;
              const stepTitle = s.title[locale as keyof typeof s.title] || s.title.en;

              return (
                <button
                  key={s.key}
                  onClick={() => handleStepClick(i)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isCompleted
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                        : 'bg-muted text-muted-foreground'
                  } ${!isCurrent && !isCompleted && !visitedSteps.has(i) ? 'opacity-60' : 'cursor-pointer'}`}
                  disabled={
                    !isCurrent && !isCompleted && !visitedSteps.has(i) && i !== currentStep + 1
                  }
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent ? 'bg-primary-foreground/20' : 'bg-current/10'
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{stepTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thin progress bar */}
        <div
          className="bg-secondary h-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step title and description */}
        <div>
          <h2 className="text-xl font-semibold">
            {step.title[locale as keyof typeof step.title] || step.title.en}
          </h2>
          {stepDescription && (
            <p className="text-muted-foreground mt-1 text-sm">{stepDescription}</p>
          )}
        </div>

        {/* Fields — single card wrapper */}
        <Card className="hover:translate-y-0 hover:shadow-xl">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {groupedFields.map((group) => {
                if (group.type === 'checkbox-group') {
                  return (
                    <div
                      key={group.fields.map((f) => f.key).join('-')}
                      className="bg-muted/50 border-border/30 flex flex-wrap gap-x-6 gap-y-3 rounded-lg border p-4 md:col-span-2"
                    >
                      {group.fields.map((field) => (
                        <WizardFieldRenderer
                          key={field.key}
                          field={field}
                          value={wizardData[field.key]}
                          onChange={handleChange}
                          error={errors[field.key]}
                          locale={locale}
                        />
                      ))}
                    </div>
                  );
                }

                const field = group.field;
                return (
                  <div key={field.key} className={field.width === 'half' ? '' : 'md:col-span-2'}>
                    <WizardFieldRenderer
                      field={field}
                      value={wizardData[field.key]}
                      onChange={handleChange}
                      error={errors[field.key]}
                      locale={locale}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <BackIcon className="h-4 w-4" />
            {tCommon('back')}
          </Button>

          <span className="text-muted-foreground text-sm" aria-live="polite">
            {t('stepOf', { current: currentStep + 1, total: totalSteps })}
          </span>

          {isLastStep ? (
            <Button
              onClick={handleSubmitWrapper}
              disabled={isSubmitting}
              size="lg"
              className="shadow-md"
            >
              <FileCheck className="h-4 w-4" />
              {isSubmitting
                ? isEditMode
                  ? t('updating')
                  : t('generating')
                : isEditMode
                  ? t('updateContract')
                  : t('submitContract')}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {tCommon('next')}
              <NextIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Column: Live Preview (2/5 width) */}
      <div className="sticky top-24 hidden lg:col-span-2 lg:block">
        <WizardPreview
          definition={definition}
          wizardData={wizardData}
          locale={locale}
          templateName={templateName}
        />
      </div>

      {/* Mobile/Tablet Preview at the bottom */}
      <div className="lg:hidden">
        <WizardPreview
          definition={definition}
          wizardData={wizardData}
          locale={locale}
          templateName={templateName}
        />
      </div>
    </div>
  );
}
