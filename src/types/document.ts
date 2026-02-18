export type DocumentStatus = "DRAFT" | "COMPLETED" | "PUBLISHED";

export interface WizardProgress {
  currentStep: number;
  completedSteps: number[];
}

export interface DocumentSummary {
  id: string;
  title: string;
  templateName: string;
  templateSlug: string;
  categorySlug: string;
  status: DocumentStatus;
  locale: string;
  updatedAt: string;
  createdAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  data: Record<string, unknown>;
  wizardProgress: WizardProgress;
  publishedAt: string | null;
}
