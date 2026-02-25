"use client";

import { useTranslations } from "next-intl";

interface AdminHeaderProps {
  userName?: string | null;
}

export function AdminHeader({ userName }: AdminHeaderProps) {
  const t = useTranslations("admin.nav");

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          {userName ?? t("dashboard")}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
          Admin
        </span>
      </div>
    </header>
  );
}
