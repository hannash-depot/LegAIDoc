"use client";

import { useTranslations } from "next-intl";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  const t = useTranslations("admin.categories");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{t("new")}</h1>
      <CategoryForm />
    </div>
  );
}
