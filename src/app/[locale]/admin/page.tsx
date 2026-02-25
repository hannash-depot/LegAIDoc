"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import { DefinitionEditor } from "@/components/admin/DefinitionEditor";
import type { TemplateDefinition } from "@/types/template";

interface TemplateItem {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  version: number;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  sortOrder: number;
  templates: TemplateItem[];
}

interface CategoryItem {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  sortOrder: number;
}

interface TemplateDetail {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  definition: unknown;
  version: number;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category: { id: string; slug: string; name: Record<string, string> };
}

type TabType = "templates" | "edit" | "create";

const DEFAULT_DEFINITION: TemplateDefinition = {
  version: 1,
  steps: [],
  documentBody: {
    he: [],
    ar: [],
    en: [],
    ru: [],
  },
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.isAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [editName, setEditName] = useState<Record<string, string>>({ he: "", ar: "", en: "", ru: "" });
  const [editDescription, setEditDescription] = useState<Record<string, string>>({ he: "", ar: "", en: "", ru: "" });
  const [editDefinition, setEditDefinition] = useState<TemplateDefinition | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Create template state
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [createSlug, setCreateSlug] = useState("");
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [createName, setCreateName] = useState<Record<string, string>>({ he: "", ar: "", en: "", ru: "" });
  const [createDescription, setCreateDescription] = useState<Record<string, string>>({ he: "", ar: "", en: "", ru: "" });
  const [createDefinition, setCreateDefinition] = useState<TemplateDefinition>(DEFAULT_DEFINITION);
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createSortOrder, setCreateSortOrder] = useState(0);
  const [creating, setCreating] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/templates");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCategories(data);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setAvailableCategories(data);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTemplates();
      fetchCategories();
    }
  }, [status, fetchTemplates, fetchCategories]);

  const openEditor = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const template: TemplateDetail = await response.json();

      setEditingTemplate(template);
      setEditName(template.name as Record<string, string>);
      setEditDescription(template.description as Record<string, string>);
      setEditDefinition(template.definition as TemplateDefinition);
      setEditIsActive(template.isActive);
      setEditSortOrder(template.sortOrder);
      setActiveTab("edit");
    } catch {
      setError(t("fetchError"));
    }
  };

  const handleSave = async () => {
    if (!editingTemplate || !editDefinition) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          definition: editDefinition,
          isActive: editIsActive,
          sortOrder: editSortOrder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccessMessage(t("saveSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) throw new Error("Failed to update");
      await fetchTemplates();
    } catch {
      setError(t("saveError"));
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteError"));
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetCreateForm = () => {
    setCreateSlug("");
    setCreateCategoryId("");
    setCreateName({ he: "", ar: "", en: "", ru: "" });
    setCreateDescription({ he: "", ar: "", en: "", ru: "" });
    setCreateDefinition(DEFAULT_DEFINITION);
    setCreateIsActive(true);
    setCreateSortOrder(0);
  };

  const openCreateForm = () => {
    resetCreateForm();
    setActiveTab("create");
  };

  const handleCreate = async () => {
    if (!createSlug.trim()) {
      setError(t("slugRequired"));
      return;
    }
    if (!createCategoryId) {
      setError(t("categoryRequired"));
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: createSlug.trim().toLowerCase().replace(/\s+/g, "-"),
          categoryId: createCategoryId,
          name: createName,
          description: createDescription,
          definition: createDefinition,
          isActive: createIsActive,
          sortOrder: createSortOrder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          throw new Error(t("slugExists"));
        }
        throw new Error(data.error || "Failed to create");
      }

      const newTemplate = await response.json();
      setSuccessMessage(t("createSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchTemplates();
      resetCreateForm();
      setActiveTab("templates");
      
      // Optionally open the editor for the new template
      openEditor(newTemplate.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary mb-4">{t("loginRequired")}</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t("goToLogin")}
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-text mb-2">{t("forbidden")}</p>
        <p className="text-text-secondary mb-4">{t("forbiddenMessage")}</p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {tc("backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-text-secondary mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t("createTemplate")}
        </button>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            {tc("close")}
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          {t("templateList")}
        </button>
        {activeTab === "create" && (
          <button
            onClick={() => setActiveTab("create")}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors border-primary text-primary"
          >
            {t("newTemplate")}
          </button>
        )}
        {editingTemplate && (
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {t("editTemplate")}: {(editingTemplate.name as Record<string, string>)[locale] || editingTemplate.slug}
          </button>
        )}
      </div>

      {/* Template List Tab */}
      {activeTab === "templates" && (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {(category.name as Record<string, string>)[locale] || category.slug}
                <span className="text-sm font-normal text-text-muted">
                  ({category.templates.length} {t("templates")})
                </span>
              </h2>

              {category.templates.length === 0 ? (
                <p className="text-text-muted text-sm px-4 py-8 bg-surface rounded-lg text-center">
                  {t("noTemplates")}
                </p>
              ) : (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface/50 text-left text-sm text-text-secondary">
                        <th className="px-4 py-3 font-medium">{t("name")}</th>
                        <th className="px-4 py-3 font-medium">{t("slug")}</th>
                        <th className="px-4 py-3 font-medium text-center">{t("version")}</th>
                        <th className="px-4 py-3 font-medium text-center">{t("status")}</th>
                        <th className="px-4 py-3 font-medium">{t("updated")}</th>
                        <th className="px-4 py-3 font-medium text-center">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {category.templates.map((template) => (
                        <tr key={template.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-text">
                              {template.name[locale] || template.slug}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-surface px-2 py-1 rounded text-text-secondary">
                              {template.slug}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-text-secondary">v{template.version}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleActive(template.id, template.isActive)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                                template.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${template.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                              {template.isActive ? t("active") : t("inactive")}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">
                            {formatDate(template.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditor(template.id)}
                                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                              >
                                {tc("edit")}
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                              >
                                {tc("delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-16 bg-surface rounded-2xl">
              <p className="text-text-secondary">{t("noTemplates")}</p>
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === "create" && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateInfo")}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("slug")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="my-template-slug"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-text-muted mt-1">{t("slugHint")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("category")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={createCategoryId}
                  onChange={(e) => setCreateCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">{t("selectCategory")}</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name[locale] || cat.slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t("sortOrder")}</label>
                <input
                  type="number"
                  value={createSortOrder}
                  onChange={(e) => setCreateSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-text">{t("isActive")}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Localized Names */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateName")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["he", "ar", "en", "ru"] as const).map((lang) => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {lang.toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={createName[lang] || ""}
                    onChange={(e) => setCreateName({ ...createName, [lang]: e.target.value })}
                    dir={lang === "he" || lang === "ar" ? "rtl" : "ltr"}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Localized Descriptions */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateDescription")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["he", "ar", "en", "ru"] as const).map((lang) => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {lang.toUpperCase()}
                  </label>
                  <textarea
                    value={createDescription[lang] || ""}
                    onChange={(e) => setCreateDescription({ ...createDescription, [lang]: e.target.value })}
                    dir={lang === "he" || lang === "ar" ? "rtl" : "ltr"}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Template Definition (Visual Editor) */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("definition")}</h3>
            <DefinitionEditor
              definition={createDefinition}
              onChange={setCreateDefinition}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white border border-border rounded-xl p-4">
            <button
              onClick={() => {
                setActiveTab("templates");
                resetCreateForm();
              }}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? tc("loading") : t("createTemplate")}
            </button>
          </div>
        </div>
      )}

      {/* Edit Tab */}
      {activeTab === "edit" && editingTemplate && (
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateInfo")}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t("slug")}</label>
                <input
                  type="text"
                  value={editingTemplate.slug}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t("category")}</label>
                <input
                  type="text"
                  value={(editingTemplate.category.name as Record<string, string>)[locale] || editingTemplate.category.slug}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t("sortOrder")}</label>
                <input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-text">{t("isActive")}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Localized Names */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateName")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["he", "ar", "en", "ru"] as const).map((lang) => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {lang.toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={editName[lang] || ""}
                    onChange={(e) => setEditName({ ...editName, [lang]: e.target.value })}
                    dir={lang === "he" || lang === "ar" ? "rtl" : "ltr"}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Localized Descriptions */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4">{t("templateDescription")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["he", "ar", "en", "ru"] as const).map((lang) => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {lang.toUpperCase()}
                  </label>
                  <textarea
                    value={editDescription[lang] || ""}
                    onChange={(e) => setEditDescription({ ...editDescription, [lang]: e.target.value })}
                    dir={lang === "he" || lang === "ar" ? "rtl" : "ltr"}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Template Definition (Visual Editor) */}
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">{t("definition")}</h3>
              <span className="text-xs text-text-muted">
                v{editingTemplate.version}
              </span>
            </div>
            {editDefinition && (
              <DefinitionEditor
                definition={editDefinition}
                onChange={setEditDefinition}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white border border-border rounded-xl p-4">
            <button
              onClick={() => {
                setActiveTab("templates");
                setEditingTemplate(null);
              }}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
            >
              {tc("back")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? tc("loading") : tc("save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
