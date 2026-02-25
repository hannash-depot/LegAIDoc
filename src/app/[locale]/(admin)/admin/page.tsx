"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";

interface Stats {
  totalTemplates: number;
  activeTemplates: number;
  totalCategories: number;
  totalDocuments: number;
  recentDocuments: number;
}

export default function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{t("dashboard.title")}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-4 gap-4">
          <AdminStatsCard
            label={t("dashboard.totalTemplates")}
            value={stats.totalTemplates}
            icon="📝"
          />
          <AdminStatsCard
            label={t("dashboard.activeTemplates")}
            value={stats.activeTemplates}
            icon="✅"
          />
          <AdminStatsCard
            label={t("dashboard.totalCategories")}
            value={stats.totalCategories}
            icon="📁"
          />
          <AdminStatsCard
            label={t("dashboard.totalDocuments")}
            value={stats.totalDocuments}
            icon="📄"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/${locale}/admin/templates/new`}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <span className="text-2xl">📝</span>
          <div>
            <p className="font-medium text-text">{t("templates.new")}</p>
            <p className="text-sm text-text-secondary">Create a new contract template</p>
          </div>
        </Link>
        <Link
          href={`/${locale}/admin/categories/new`}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <span className="text-2xl">📁</span>
          <div>
            <p className="font-medium text-text">{t("categories.new")}</p>
            <p className="text-sm text-text-secondary">Add a new template category</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
