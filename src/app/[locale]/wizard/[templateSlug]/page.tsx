"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function WizardEntryPage({
  params,
}: {
  params: Promise<{ templateSlug: string }>;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("common");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createAndRedirect() {
      try {
        const { templateSlug } = await params;

        // Create a new document
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateSlug, locale }),
        });

        // If not authenticated, redirect to login
        if (res.status === 401) {
          router.replace(`/login?next=/wizard/${templateSlug}` as "/login");
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create document");
          return;
        }

        const doc = await res.json();
        router.replace(
          `/wizard/${templateSlug}/0?doc=${doc.id}` as "/dashboard"
        );
      } catch {
        setError("An error occurred");
      }
    }

    createAndRedirect();
  }, [params, locale, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => router.push("/templates")}
            className="text-primary hover:underline"
          >
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">{t("loading")}</p>
      </div>
    </div>
  );
}
