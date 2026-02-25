"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { LocalizedString } from "@/types/template";

interface Category {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { templates: number };
}

export default function CategoriesPage() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/categories/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{t("categories.title")}</h1>
        <Link
          href={`/${locale}/admin/categories/new`}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
        >
          + {t("categories.new")}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
          <p className="text-sm text-text-muted">No categories found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-start px-4 py-3 font-medium text-text-secondary">
                  {t("categories.name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">
                  {t("categories.slug")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">
                  {t("categories.templateCount")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">
                  {t("common.status")}
                </th>
                <th className="text-end px-4 py-3 font-medium text-text-secondary">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-b-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-text">
                    {(cat.name as LocalizedString).en}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {cat._count.templates}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={cat.isActive ? "active" : "inactive"}>
                      {cat.isActive ? t("templates.active") : t("templates.inactive")}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/categories/${cat.id}`}
                        className="text-xs text-primary hover:text-primary-dark font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteId(cat.id)}
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
        message={t("categories.deleteConfirm")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
