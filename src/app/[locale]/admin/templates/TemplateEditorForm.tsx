"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  slug: string;
  name: Record<string, string>;
}

interface TemplateEditorFormProps {
  locale: string;
  categories: Category[];
  initialData?: {
    id: string;
    slug: string;
    categorySlug: string;
    name: { he: string; ar: string; en: string; ru: string };
    description: { he: string; ar: string; en: string; ru: string };
    definition: string; // JSON string
    isActive: boolean;
  };
}

const LOCALES = ["en", "he", "ar", "ru"] as const;
const LOCALE_LABELS: Record<string, string> = { en: "English", he: "עברית", ar: "العربية", ru: "Русский" };

function LocalizedFields({
  label,
  fieldKey,
  values,
  onChange,
  multiline = false,
}: {
  label: string;
  fieldKey: "name" | "description";
  values: Record<string, string>;
  onChange: (locale: string, value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="grid grid-cols-1 gap-2">
        {LOCALES.map((loc) =>
          multiline ? (
            <label key={loc} className="flex flex-col gap-1">
              <span className="text-xs text-text-secondary">{LOCALE_LABELS[loc]}</span>
              <textarea
                className="border border-border rounded-lg px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={values[loc] ?? ""}
                onChange={(e) => onChange(loc, e.target.value)}
              />
            </label>
          ) : (
            <label key={loc} className="flex items-center gap-2">
              <span className="text-xs text-text-secondary w-16 shrink-0">{LOCALE_LABELS[loc]}</span>
              <input
                type="text"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={values[loc] ?? ""}
                onChange={(e) => onChange(loc, e.target.value)}
              />
            </label>
          )
        )}
      </div>
    </div>
  );
}

export function TemplateEditorForm({ locale, categories, initialData }: TemplateEditorFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [categorySlug, setCategorySlug] = useState(
    initialData?.categorySlug ?? categories[0]?.slug ?? ""
  );
  const [name, setName] = useState<Record<string, string>>(
    initialData?.name ?? { he: "", ar: "", en: "", ru: "" }
  );
  const [description, setDescription] = useState<Record<string, string>>(
    initialData?.description ?? { he: "", ar: "", en: "", ru: "" }
  );
  const [definition, setDefinition] = useState(
    initialData?.definition ?? JSON.stringify({ version: 1, steps: [], documentBody: { he: [], ar: [], en: [], ru: [] } }, null, 2)
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateName(loc: string, val: string) {
    setName((prev) => ({ ...prev, [loc]: val }));
  }
  function updateDescription(loc: string, val: string) {
    setDescription((prev) => ({ ...prev, [loc]: val }));
  }

  function validateDefinition(text: string): boolean {
    try {
      JSON.parse(text);
      setDefinitionError(null);
      return true;
    } catch (e) {
      setDefinitionError((e as Error).message);
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDefinition(definition)) return;

    setSaving(true);
    setError(null);

    const payload = {
      slug,
      categorySlug,
      name,
      description,
      definition: JSON.parse(definition),
      isActive,
    };

    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/templates/${initialData!.id}`
          : "/api/admin/templates",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ? JSON.stringify(data.error) : `Error ${res.status}`);
        return;
      }

      router.push(`/${locale}/admin/templates`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <h2 className="font-semibold text-lg">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Slug</span>
            <input
              type="text"
              required
              pattern="^[a-z0-9-]+$"
              title="Lowercase letters, numbers, and hyphens only"
              className="border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. residential-rental"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isEdit}
            />
            {isEdit && (
              <span className="text-xs text-text-secondary">Slug cannot be changed after creation.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Category</span>
            <select
              required
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {(cat.name as Record<string, string>).en ?? cat.slug}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active (visible to users)
          </label>
        </div>
      </div>

      {/* Localized name */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <h2 className="font-semibold text-lg">Localized Content</h2>
        <LocalizedFields label="Template Name" fieldKey="name" values={name} onChange={updateName} />
        <LocalizedFields
          label="Description"
          fieldKey="description"
          values={description}
          onChange={updateDescription}
          multiline
        />
      </div>

      {/* Definition JSON */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Template Definition (JSON)</h2>
          <button
            type="button"
            onClick={() => {
              try {
                setDefinition(JSON.stringify(JSON.parse(definition), null, 2));
                setDefinitionError(null);
              } catch {
                // ignore — validateDefinition will show the error
              }
            }}
            className="text-xs px-3 py-1 rounded border border-border hover:bg-surface transition-colors"
          >
            Format
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          The definition controls wizard steps, fields, and document body. Must be valid JSON.
        </p>
        <textarea
          className={`w-full h-96 font-mono text-xs border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            definitionError ? "border-red-400" : "border-border"
          }`}
          value={definition}
          onChange={(e) => {
            setDefinition(e.target.value);
            validateDefinition(e.target.value);
          }}
          spellCheck={false}
        />
        {definitionError && (
          <p className="text-xs text-red-600 font-mono">{definitionError}</p>
        )}
      </div>

      {/* Actions */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !!definitionError}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
