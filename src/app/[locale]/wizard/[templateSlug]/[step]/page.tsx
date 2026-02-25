"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { WizardProvider } from "@/components/providers/WizardProvider";
import { WizardShell } from "@/components/wizard/WizardShell";
import { Navbar } from "@/components/layout/Navbar";
import type { TemplateDefinition } from "@/types/template";
import type { WizardProgress } from "@/types/document";

interface DocumentData {
  id: string;
  locale: string;
  data: Record<string, unknown>;
  wizardProgress: WizardProgress;
  template: {
    slug: string;
    definition: TemplateDefinition;
  };
}

function WizardStepContent({
  params,
}: {
  params: Promise<{ templateSlug: string; step: string }>;
}) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      const docId = searchParams.get("doc");
      if (!docId) {
        setError("No document ID provided");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (!res.ok) {
          setError("Failed to load document");
          setLoading(false);
          return;
        }

        const doc = await res.json();
        const { step } = await params;
        const stepIndex = parseInt(step, 10);
        
        // Validate step index is a valid number and within bounds
        const definition = doc.template.definition as TemplateDefinition;
        if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= definition.steps.length) {
          setError("Invalid step");
          setLoading(false);
          return;
        }

        setDocData({
          id: doc.id,
          locale: doc.locale,
          data: doc.data as Record<string, unknown>,
          wizardProgress: {
            ...(doc.wizardProgress as WizardProgress),
            currentStep: stepIndex,
          },
          template: {
            slug: doc.template.slug,
            definition: doc.template.definition as TemplateDefinition,
          },
        });
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [searchParams, params]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !docData) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-error">{error || "Something went wrong"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <WizardProvider
        documentId={docData.id}
        templateSlug={docData.template.slug}
        definition={docData.template.definition}
        initialData={docData.data}
        initialProgress={docData.wizardProgress}
        locale={locale}
      >
        <WizardShell />
      </WizardProvider>
    </>
  );
}

export default function WizardStepPage({
  params,
}: {
  params: Promise<{ templateSlug: string; step: string }>;
}) {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </>
      }
    >
      <WizardStepContent params={params} />
    </Suspense>
  );
}
