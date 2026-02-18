"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { useWizard } from "@/components/providers/WizardProvider";
import { WizardProgress } from "./WizardProgress";
import { WizardStepForm } from "./WizardStepForm";
import { WizardNavigation } from "./WizardNavigation";
import { ContractPreview } from "./ContractPreview";
import { validateStepData } from "@/lib/templates/validator";
import type { Locale } from "@/lib/i18n/routing";

export function WizardShell() {
  const { definition, progress, data, locale, nextStep, saveProgress, documentId } =
    useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);
  const t = useTranslations("wizard");
  const router = useRouter();

  const currentStep = definition.steps[progress.currentStep];

  const handleNext = useCallback(() => {
    if (!currentStep) return;

    const result = validateStepData(currentStep, data, locale as Locale);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    saveProgress();
    nextStep();
  }, [currentStep, data, locale, saveProgress, nextStep]);

  const handleFinalize = useCallback(async () => {
    if (!currentStep) return;

    // Validate last step
    const result = validateStepData(currentStep, data, locale as Locale);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await saveProgress();

    // Publish the document
    try {
      const res = await fetch(`/api/documents/${documentId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/documents/${documentId}` as "/dashboard");
      }
    } catch (err) {
      console.error("Failed to publish:", err);
    }
  }, [currentStep, data, locale, saveProgress, documentId, router]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="mb-8">
        <WizardProgress />
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Form panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold mb-6">
              {currentStep?.title[locale as Locale]}
            </h2>
            <WizardStepForm errors={errors} />
            <WizardNavigation onNext={handleNext} onFinalize={handleFinalize} />
          </div>
        </div>

        {/* Preview panel (desktop) */}
        <div className="hidden lg:block w-[440px] shrink-0">
          <div className="sticky top-24">
            <ContractPreview />
          </div>
        </div>
      </div>

      {/* Mobile preview toggle */}
      <div className="lg:hidden fixed bottom-4 end-4 z-50">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {showPreview ? t("hidePreview") : t("preview")}
        </button>
      </div>

      {/* Mobile preview panel */}
      {showPreview && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowPreview(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
            <ContractPreview />
          </div>
        </div>
      )}
    </div>
  );
}
