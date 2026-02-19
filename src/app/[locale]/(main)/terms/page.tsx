import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function TermsPage() {
  const t = useTranslations("terms");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");

  const sections = [
    "acceptance",
    "service",
    "userResponsibilities",
    "limitation",
    "privacy",
    "changes",
  ] as const;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text mb-2">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("lastUpdated")}</p>
      </div>

      {/* Prominent disclaimer box */}
      <div className="mb-10 rounded-xl border-2 border-amber-400 bg-amber-50 p-6">
        <div className="flex gap-4">
          <div className="shrink-0 mt-0.5">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900 mb-2">
              {t("disclaimer.title")}
            </h2>
            <p className="text-amber-800 leading-relaxed">
              {t("disclaimer.body")}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((key) => (
          <section key={key}>
            <h2 className="text-lg font-semibold text-text mb-2">
              {t(`sections.${key}.title`)}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
        <Link href="/" className="hover:text-primary transition-colors">
          ← {tNav("home")}
        </Link>
        <Link href="/privacy" className="hover:text-primary transition-colors">
          {tFooter("privacy")}
        </Link>
      </div>
    </main>
  );
}
