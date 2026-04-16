import { db } from '@/lib/db';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from '@/components/ui/scroll-reveal';
import { FileText, ArrowRight, ScrollText } from 'lucide-react';
import { getIconByName } from '@/lib/icon-utils';

const categoryGradients: Record<string, string> = {
  'rental-agreements': 'from-blue-500 to-cyan-400',
  employment: 'from-amber-500 to-yellow-400',
  'real-estate': 'from-emerald-500 to-green-400',
  'power-of-attorney': 'from-orange-500 to-rose-400',
  'family-law': 'from-rose-400 to-yellow-400',
};

function getCategoryGradient(slug: string): string {
  return categoryGradients[slug] || 'from-primary to-blue-400';
}

export default async function TemplatesPage() {
  const locale = await getLocale();
  const t = await getTranslations('templates');

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      templates: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const getLocalizedName = (item: {
    nameHe: string;
    nameAr: string;
    nameEn: string;
    nameRu: string;
  }) => {
    const key = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof item;
    return (item[key] as string) || item.nameEn;
  };

  const getLocalizedDesc = (item: {
    descHe: string;
    descAr: string;
    descEn: string;
    descRu: string;
  }) => {
    const key = `desc${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof item;
    return (item[key] as string) || item.descEn;
  };

  const totalTemplates = categories.reduce((sum, c) => sum + c.templates.length, 0);

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <ScrollReveal>
        <div className="text-center">
          <h1 className="text-gradient text-4xl font-bold tracking-tight">{t('browseTitle')}</h1>
          <p className="text-muted-foreground mt-3 text-lg">{t('browseDescription')}</p>
          {totalTemplates > 0 && (
            <div className="mt-4 flex justify-center">
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                <FileText className="h-3.5 w-3.5" />
                {t('templateCount', { count: totalTemplates })}
              </span>
            </div>
          )}
        </div>
      </ScrollReveal>

      {categories.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-20">
          <div className="bg-muted mb-4 rounded-full p-6">
            <FileText className="h-10 w-10" />
          </div>
          <p className="text-lg font-medium">{t('noTemplates')}</p>
        </div>
      ) : (
        categories.map((category) => {
          const Icon = (category.icon ? getIconByName(category.icon) : null) || ScrollText;
          const gradient = getCategoryGradient(category.slug);
          return (
            <section
              key={category.id}
              className="border-border/30 bg-card/30 relative space-y-5 overflow-hidden rounded-2xl border p-6 backdrop-blur-sm"
            >
              {/* Gradient accent bar */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-80`}
              />

              <ScrollReveal>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl leading-tight font-semibold">
                      {getLocalizedName(category)}
                      <span className="text-muted-foreground ms-2 text-sm font-normal">
                        ({category.templates.length})
                      </span>
                    </h2>
                    {getLocalizedDesc(category) && (
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {getLocalizedDesc(category)}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {category.templates.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                  {t('noTemplates')}
                </div>
              ) : (
                <ScrollRevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.templates.map((template) => (
                    <ScrollRevealItem key={template.id} className="h-full">
                      <Link
                        href={`/wizard/${template.id}` as `/wizard/${string}`}
                        className="group block h-full"
                      >
                        <Card className="hover:border-primary/50 relative flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:shadow-md">
                          {/* Hover gradient accent */}
                          <div
                            className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                          />
                          <CardHeader className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary shrink-0 rounded-md p-2 transition-colors duration-300">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <CardTitle className="group-hover:text-primary pt-0.5 leading-tight transition-colors">
                                  {getLocalizedName(template)}
                                </CardTitle>
                              </div>
                              <div className="bg-primary/10 text-primary shrink-0 -translate-x-2 rounded-full p-1.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-2 rtl:rotate-180 rtl:group-hover:translate-x-0">
                                <ArrowRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                            {getLocalizedDesc(template) && (
                              <CardDescription className="mt-2 line-clamp-3 ps-11">
                                {getLocalizedDesc(template)}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      </Link>
                    </ScrollRevealItem>
                  ))}
                </ScrollRevealGroup>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
