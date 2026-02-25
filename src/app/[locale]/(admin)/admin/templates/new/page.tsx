"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { TemplateMetadataForm } from "@/components/admin/TemplateMetadataForm";
import type { LocalizedString } from "@/types/template";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

interface Category {
  id: string;
  slug: string;
  name: LocalizedString;
}

export default function NewTemplatePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.templates");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [slug, setSlug] = useState("");
  const [name, setName] = useState<LocalizedString>({ ...emptyLocalized });
  const [description, setDescription] = useState<LocalizedString>({ ...emptyLocalized });
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          categoryId,
          name,
          description,
          sortOrder,
          definition: {
            version: 2,
            steps: [],
            sections: [],
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }

      const template = await res.json();
      router.push(`/${locale}/admin/templates/${template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{t("new")}</h1>

      {error && (
        <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{error}</div>
      )}

      <form onSubmit={handleCreate}>
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
          isEditing={false}
        />

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving || !slug || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Template"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
