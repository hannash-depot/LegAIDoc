"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LocalizedInput } from "./LocalizedInput";
import { LocalizedTextarea } from "./LocalizedTextarea";
import type { LocalizedString } from "@/types/template";

const ICON_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "briefcase", label: "Briefcase" },
  { value: "building", label: "Building" },
  { value: "scale", label: "Scale" },
  { value: "shield", label: "Shield" },
  { value: "file-text", label: "File" },
  { value: "users", label: "Users" },
  { value: "car", label: "Car" },
];

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

interface CategoryFormProps {
  categoryId?: string;
  initialData?: {
    slug: string;
    name: LocalizedString;
    description: LocalizedString;
    icon: string | null;
    sortOrder: number;
  };
}

export function CategoryForm({ categoryId, initialData }: CategoryFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");
  const isEditing = !!categoryId;

  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [name, setName] = useState<LocalizedString>(initialData?.name ?? { ...emptyLocalized });
  const [description, setDescription] = useState<LocalizedString>(
    initialData?.description ?? { ...emptyLocalized }
  );
  const [icon, setIcon] = useState(initialData?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/categories/${categoryId}`
        : "/api/admin/categories";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, description, icon: icon || null, sortOrder }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      router.push(`/${locale}/admin/categories`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="p-3 bg-error/10 text-error text-sm rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("categories.slug")} <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="e.g. rental"
          required
          disabled={isEditing}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface disabled:text-text-muted"
        />
      </div>

      <LocalizedInput
        label={t("categories.name")}
        value={name}
        onChange={setName}
        required
        placeholder="Category name"
      />

      <LocalizedTextarea
        label={t("categories.description")}
        value={description}
        onChange={setDescription}
        required
        rows={3}
        placeholder="Category description"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("categories.icon")}
          </label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">None</option>
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("categories.sortOrder")}
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "..." : t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover rounded-lg transition-colors"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
