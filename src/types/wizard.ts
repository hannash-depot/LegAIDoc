import type { TemplateDefinition } from "./template";
import type { WizardProgress } from "./document";

export interface WizardState {
  documentId: string;
  templateSlug: string;
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  progress: WizardProgress;
  locale: string;
  isDirty: boolean;
  isSaving: boolean;
}

export interface WizardActions {
  setFieldValue: (key: string, value: unknown) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveProgress: () => Promise<void>;
}
