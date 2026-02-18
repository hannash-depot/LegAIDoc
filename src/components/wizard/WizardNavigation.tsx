"use client";

import { useWizard } from "@/components/providers/WizardProvider";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface WizardNavigationProps {
  onNext: () => void;
  onFinalize: () => void;
}

export function WizardNavigation({ onNext, onFinalize }: WizardNavigationProps) {
  const { definition, progress, prevStep, saveProgress, isDirty, isSaving } =
    useWizard();
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");

  const isFirstStep = progress.currentStep === 0;
  const isLastStep = progress.currentStep === definition.steps.length - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <button
        onClick={prevStep}
        disabled={isFirstStep}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isFirstStep
            ? "text-text-muted cursor-not-allowed"
            : "text-text-secondary hover:bg-surface-hover"
        )}
      >
        <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {tCommon("previous")}
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={saveProgress}
          disabled={!isDirty || isSaving}
          className="px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? t("saving") : isDirty ? t("saveDraft") : t("saved")}
        </button>

        {isLastStep ? (
          <button
            onClick={onFinalize}
            className="flex items-center gap-2 px-6 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
          >
            {t("finalize")}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            {tCommon("next")}
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
