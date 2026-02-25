"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { LocalizedString } from "@/types/template";

interface Template {
  id: string;
  slug: string;
  name: LocalizedString;
  version: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  category: { id: string; slug: string; name: LocalizedString };
  _count: { documents: number; versions: number };
}

export default function TemplatesPage() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/admin/templates?status=${filter}`);
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTemplates();
  }, [filter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/templates/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadTemplates();
  };

  const handleToggleActive = async (id: string) => {
    await fetch(`/api/admin/templates/${id}/toggle-active`, { method: "POST" });
    loadTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{t("templates.title")}</h1>
        <Link
          href={`/${locale}/admin/templates/new`}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
        >
          + {t("templates.new")}
        </Link>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white text-text-secondary border border-border hover:bg-surface"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
          <p className="text-sm text-text-muted">No templates found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-start px-4 py-3 font-medium text-text-secondary">Name</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">Category</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{t("templates.version")}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">Documents</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{t("common.status")}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{t("common.updated")}</th>
                <th className="text-end px-4 py-3 font-medium text-text-secondary">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr key={tmpl.id} className="border-b border-border last:border-b-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-text">{tmpl.name.en}</span>
                      <span className="block text-xs text-text-muted font-mono">{tmpl.slug}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {(tmpl.category.name as LocalizedString).en}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">v{tmpl.version}</td>
                  <td className="px-4 py-3 text-text-secondary">{tmpl._count.documents}</td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={tmpl.isActive ? "active" : "inactive"}>
                      {tmpl.isActive ? t("templates.active") : t("templates.inactive")}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(tmpl.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/templates/${tmpl.id}`}
                        className="text-xs text-primary hover:text-primary-dark font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(tmpl.id)}
                        className="text-xs text-text-secondary hover:text-text font-medium"
                      >
                        {tmpl.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(tmpl.id)}
                        className="text-xs text-error hover:text-error/80 font-medium"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t("common.delete")}
        message={t("templates.deleteConfirm")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
