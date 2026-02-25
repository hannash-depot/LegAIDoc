"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">LD</span>
            </div>
            <span className="text-sm text-text-secondary">
              &copy; {year} LegAIDoc. {t("rights")}.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-text transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-text transition-colors">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
