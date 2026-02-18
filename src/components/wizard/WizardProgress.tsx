"use client";

import { useWizard } from "@/components/providers/WizardProvider";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils/cn";

export function WizardProgress() {
  const { definition, progress, locale, goToStep } = useWizard();
  const steps = definition.steps;

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = progress.completedSteps.includes(index);
        const isCurrent = progress.currentStep === index;
        const isAccessible = isCompleted || isCurrent || index === 0;

        return (
          <button
            key={step.key}
            onClick={() => isAccessible && goToStep(index)}
            disabled={!isAccessible}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all",
              isCurrent && "bg-primary text-white font-medium",
              isCompleted &&
                !isCurrent &&
                "bg-success/10 text-success hover:bg-success/20 cursor-pointer",
              !isCompleted &&
                !isCurrent &&
                "bg-surface text-text-muted cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                isCurrent && "bg-white/20 text-white",
                isCompleted && !isCurrent && "bg-success text-white",
                !isCompleted && !isCurrent && "bg-border text-text-muted"
              )}
            >
              {isCompleted && !isCurrent ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span className="hidden sm:inline">
              {step.title[locale as Locale]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
