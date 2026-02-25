"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CategoryForm } from "@/components/admin/CategoryForm";
import type { LocalizedString } from "@/types/template";

interface CategoryData {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string | null;
  sortOrder: number;
}

export default function EditCategoryPage() {
  const t = useTranslations("admin.categories");
  const params = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/categories/${params.categoryId}`);
        if (!res.ok) throw new Error("Not found");
        setCategory(await res.json());
      } catch {
        setError("Category not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.categoryId]);

  if (loading) {
    return <div className="text-sm text-text-muted p-4">Loading...</div>;
  }

  if (error || !category) {
    return (
      <div className="p-4 bg-error/10 text-error text-sm rounded-lg">
        {error || "Category not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{t("edit")}</h1>
      <CategoryForm
        categoryId={category.id}
        initialData={{
          slug: category.slug,
          name: category.name,
          description: category.description,
          icon: category.icon,
          sortOrder: category.sortOrder,
        }}
      />
    </div>
  );
}
