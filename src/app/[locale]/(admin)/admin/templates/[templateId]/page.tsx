"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { TemplateMetadataForm } from "@/components/admin/TemplateMetadataForm";
import { WizardStepsEditor } from "@/components/admin/WizardStepsEditor";
import { SectionTree } from "@/components/admin/SectionTree";
import { TemplatePreview } from "@/components/admin/TemplatePreview";
import { VersionHistory } from "@/components/admin/VersionHistory";
import type { LocalizedString, TemplateStep } from "@/types/template";
import type { TemplateSection, EnhancedTemplateDefinition } from "@/types/admin-template";
import { isEnhancedDefinition } from "@/lib/templates/compiler";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

type Tab = "metadata" | "steps" | "sections" | "preview" | "versions";

interface Category {
  id: string;
  slug: string;
  name: LocalizedString;
}

interface TemplateData {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  categoryId: string;
  version: number;
  isActive: boolean;
  sortOrder: number;
  definition: EnhancedTemplateDefinition | Record<string, unknown>;
  category: Category;
  _count: { documents: number };
}

export default function TemplateEditorPage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.templates");

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("metadata");

  // Form state
  const [slug, setSlug] = useState("");
  const [name, setName] = useState<LocalizedString>({ ...emptyLocalized });
  const [description, setDescription] = useState<LocalizedString>({ ...emptyLocalized });
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [changelog, setChangelog] = useState("");

  const loadTemplate = useCallback(async () => {
    try {
      const [tmplRes, catRes] = await Promise.all([
        fetch(`/api/admin/templates/${params.templateId}`),
        fetch("/api/admin/categories"),
      ]);

      if (!tmplRes.ok) throw new Error("Template not found");

      const tmpl: TemplateData = await tmplRes.json();
      const cats: Category[] = await catRes.json();

      setTemplate(tmpl);
      setCategories(cats);

      // Populate form
      setSlug(tmpl.slug);
      setName(tmpl.name);
      setDescription(tmpl.description);
      setCategoryId(tmpl.categoryId);
      setIsActive(tmpl.isActive);
      setSortOrder(tmpl.sortOrder);

      // Handle definition
      const def = tmpl.definition;
      if (isEnhancedDefinition(def)) {
        setSteps(def.steps);
        setSections(def.sections);
      } else {
        // v1 definition — load steps from it, sections will be empty
        const v1Def = def as { steps?: TemplateStep[] };
        setSteps(v1Def.steps ?? []);
        setSections([]);
      }
    } catch {
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [params.templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const definition: EnhancedTemplateDefinition = {
        version: 2,
        steps,
        sections,
      };

      const res = await fetch(`/api/admin/templates/${params.templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          categoryId,
          isActive,
          sortOrder,
          definition,
          changelog: changelog || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setSuccessMsg(t("saveSuccess"));
      setChangelog("");
      // Reload to get updated version number
      await loadTemplate();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      const res = await fetch(
        `/api/admin/templates/${params.templateId}/versions/${versionId}`
      );
      if (!res.ok) throw new Error("Failed to load version");

      const version = await res.json();
      const def = version.definition;

      if (isEnhancedDefinition(def)) {
        setSteps(def.steps);
        setSections(def.sections);
      } else {
        const v1Def = def as { steps?: TemplateStep[] };
        setSteps(v1Def.steps ?? []);
        setSections([]);
      }

      setName(version.name);
      setDescription(version.description);
      setChangelog(`Restored from version ${version.version}`);
      setActiveTab("metadata");
    } catch {
      setError("Failed to restore version");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl border border-border animate-pulse" />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="p-4 bg-error/10 text-error text-sm rounded-lg">{error}</div>
    );
  }

  if (!template) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "metadata", label: t("metadata") },
    { key: "steps", label: t("wizardSteps") },
    { key: "sections", label: t("documentSections") },
    { key: "preview", label: t("preview") },
    { key: "versions", label: t("versionHistory") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t("edit")}: {template.name.en}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            v{template.version} &middot; {template.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder={t("changelog")}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : t("common.save") ?? "Save"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{error}</div>
      )}
      {successMsg && (
        <div className="p-3 bg-success/10 text-success text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-border p-6">
        {activeTab === "metadata" && (
          <TemplateMetadataForm
            slug={slug}
            onSlugChange={setSlug}
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            categoryId={categoryId}
            onCategoryIdChange={setCategoryId}
            isActive={isActive}
            onIsActiveChange={setIsActive}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            categories={categories}
            isEditing={true}
            version={template.version}
          />
        )}

        {activeTab === "steps" && (
          <WizardStepsEditor steps={steps} onChange={setSteps} />
        )}

        {activeTab === "sections" && (
          <div className="ps-8">
            <SectionTree
              sections={sections}
              onChange={setSections}
              steps={steps}
            />
          </div>
        )}

        {activeTab === "preview" && (
          <TemplatePreview templateId={template.id} />
        )}

        {activeTab === "versions" && (
          <VersionHistory
            templateId={template.id}
            currentVersion={template.version}
            onRestore={handleRestore}
          />
        )}
      </div>
    </div>
  );
}
