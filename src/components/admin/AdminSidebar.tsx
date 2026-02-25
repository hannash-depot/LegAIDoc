"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin.nav");

  const navItems: NavItem[] = [
    { href: `/${locale}/admin`, label: t("dashboard"), icon: "📊" },
    { href: `/${locale}/admin/categories`, label: t("categories"), icon: "📁" },
    { href: `/${locale}/admin/templates`, label: t("templates"), icon: "📝" },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-e border-border min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-primary">LegAIDoc Admin</h1>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-border">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text transition-colors"
        >
          <span>←</span>
          <span>{t("backToSite")}</span>
        </Link>
      </div>
    </aside>
  );
}
