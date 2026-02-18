"use client";

import { useWizard } from "@/components/providers/WizardProvider";
import { WizardFieldRenderer } from "./WizardFieldRenderer";
import type { Locale } from "@/lib/i18n/routing";

interface WizardStepFormProps {
  errors: Record<string, string>;
}

export function WizardStepForm({ errors }: WizardStepFormProps) {
  const { definition, progress, locale } = useWizard();
  const step = definition.steps[progress.currentStep];
  const loc = locale as Locale;

  if (!step) return null;

  return (
    <div className="space-y-6">
      {step.description && (
        <p className="text-sm text-text-secondary">
          {step.description[loc]}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {step.fields.map((field) => (
          <WizardFieldRenderer
            key={field.key}
            field={field}
            error={errors[field.key]}
          />
        ))}
      </div>
    </div>
  );
}
