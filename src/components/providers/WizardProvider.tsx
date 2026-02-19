"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type { TemplateDefinition } from "@/types/template";
import type { WizardProgress } from "@/types/document";

interface WizardContextValue {
  documentId: string;
  templateSlug: string;
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  progress: WizardProgress;
  locale: string;
  isDirty: boolean;
  isSaving: boolean;
  setFieldValue: (key: string, value: unknown) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveProgress: () => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return ctx;
}

interface WizardProviderProps {
  children: ReactNode;
  documentId: string;
  templateSlug: string;
  definition: TemplateDefinition;
  initialData: Record<string, unknown>;
  initialProgress: WizardProgress;
  locale: string;
}

export function WizardProvider({
  children,
  documentId,
  templateSlug,
  definition,
  initialData,
  initialProgress,
  locale,
}: WizardProviderProps) {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [progress, setProgress] = useState<WizardProgress>(initialProgress);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setFieldValue = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < definition.steps.length) {
        setProgress((prev) => ({ ...prev, currentStep: step }));
      }
    },
    [definition.steps.length]
  );

  const nextStep = useCallback(() => {
    setProgress((prev) => {
      const next = prev.currentStep + 1;
      if (next >= definition.steps.length) return prev;
      const completed = prev.completedSteps.includes(prev.currentStep)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStep];
      return { currentStep: next, completedSteps: completed };
    });
  }, [definition.steps.length]);

  const prevStep = useCallback(() => {
    setProgress((prev) => {
      const next = prev.currentStep - 1;
      if (next < 0) return prev;
      return { ...prev, currentStep: next };
    });
  }, []);

  const saveProgress = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, wizardProgress: progress }),
      });
      if (res.ok) {
        setIsDirty(false);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [documentId, data, progress]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, saveProgress]);

  return (
    <WizardContext.Provider
      value={{
        documentId,
        templateSlug,
        definition,
        data,
        progress,
        locale,
        isDirty,
        isSaving,
        setFieldValue,
        goToStep,
        nextStep,
        prevStep,
        saveProgress,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
