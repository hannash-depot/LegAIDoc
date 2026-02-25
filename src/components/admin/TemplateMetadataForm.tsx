"use client";

import { useTranslations } from "next-intl";
import { LocalizedInput } from "./LocalizedInput";
import { LocalizedTextarea } from "./LocalizedTextarea";
import type { LocalizedString } from "@/types/template";

interface Category {
  id: string;
  slug: string;
  name: LocalizedString | Record<string, string>;
}

interface TemplateMetadataFormProps {
  slug: string;
  onSlugChange: (slug: string) => void;
  name: LocalizedString;
  onNameChange: (name: LocalizedString) => void;
  description: LocalizedString;
  onDescriptionChange: (description: LocalizedString) => void;
  categoryId: string;
  onCategoryIdChange: (categoryId: string) => void;
  isActive: boolean;
  onIsActiveChange: (isActive: boolean) => void;
  sortOrder: number;
  onSortOrderChange: (sortOrder: number) => void;
  categories: Category[];
  isEditing: boolean;
  version?: number;
}

export function TemplateMetadataForm({
  slug,
  onSlugChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  categoryId,
  onCategoryIdChange,
  isActive,
  onIsActiveChange,
  sortOrder,
  onSortOrderChange,
  categories,
  isEditing,
  version,
}: TemplateMetadataFormProps) {
  const t = useTranslations("admin.templates");

  return (
    <div className="space-y-6 max-w-2xl">
      {isEditing && version && (
        <div className="flex items-center gap-4 p-3 bg-surface rounded-lg">
          <span className="text-sm text-text-secondary">
            {t("version")}: <strong>{version}</strong>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            isActive ? "bg-success/10 text-success" : "bg-text-muted/10 text-text-muted"
          }`}>
            {isActive ? t("active") : t("inactive")}
          </span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Slug <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) =>
            onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
          }
          placeholder="e.g. residential-rental"
          required
          disabled={isEditing}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface disabled:text-text-muted"
        />
      </div>

      <LocalizedInput
        label="Template Name"
        value={name}
        onChange={onNameChange}
        required
        placeholder="Template name"
      />

      <LocalizedTextarea
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        required
        rows={3}
        placeholder="Template description"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Category <span className="text-error">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {(cat.name as LocalizedString).en ?? cat.slug}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Sort Order
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <label className="flex items-center gap-3">
        <span className="text-sm font-medium text-text">{t("active")}</span>
        <button
          type="button"
          onClick={() => onIsActiveChange(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? "bg-success" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </label>
    </div>
  );
}
