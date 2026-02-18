import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-6">
            {t("home.hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/templates"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t("home.hero.cta")}
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors"
            >
              {t("home.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {(
            [
              { key: "templates", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { key: "wizard", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
              { key: "languages", icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" },
              { key: "download", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            ] as const
          ).map((feature) => (
            <div
              key={feature.key}
              className="text-center p-6 rounded-xl bg-surface hover:bg-surface-hover transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={feature.icon}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t(`home.features.${feature.key}.title`)}
              </h3>
              <p className="text-text-secondary text-sm">
                {t(`home.features.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
