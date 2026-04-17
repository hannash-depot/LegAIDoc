import { auth } from '@/auth';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, redirect } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { FileText, ListChecks, Languages, Download, Check, ArrowRight } from 'lucide-react';
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from '@/components/ui/scroll-reveal';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations('landing')]);

  if (session?.user) {
    redirect({ href: '/dashboard', locale });
  }

  const features = [
    { title: t('feature1Title'), desc: t('feature1Desc'), Icon: FileText },
    { title: t('feature2Title'), desc: t('feature2Desc'), Icon: ListChecks },
    { title: t('feature3Title'), desc: t('feature3Desc'), Icon: Languages },
    { title: t('feature4Title'), desc: t('feature4Desc'), Icon: Download },
  ];

  const pricingIncludes = [
    t('pricingFeature1'),
    t('pricingFeature2'),
    t('pricingFeature3'),
    t('pricingFeature4'),
  ];

  return (
    <main className="bg-background flex min-h-screen flex-col">
      <header className="border-border/60 bg-background/95 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold tracking-tight">LegAIDoc</span>
            <span className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-xs font-bold">
              LD
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              {t('navHome')}
            </Link>
            <Link
              href={'/templates' as const}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('navTemplates')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href={'/login' as '/templates'}
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-flex"
            >
              {t('navLogin')}
            </Link>
            <Link href={'/register' as '/templates'}>
              <Button size="sm" className="h-9 rounded-md px-4 text-sm font-semibold">
                {t('navRegister')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-background relative overflow-hidden px-4 py-20 sm:py-28">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h1 className="text-foreground font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href={'/register' as '/templates'}>
              <Button
                size="lg"
                className="group h-11 rounded-md px-6 text-base font-semibold shadow-sm"
              >
                {t('heroCta')}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Button>
            </Link>
            <Link href={'/templates' as const}>
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary/5 h-11 rounded-md border px-6 text-base font-semibold"
              >
                {t('heroCtaSecondary')}
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <section className="border-border/60 border-t px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollRevealGroup className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <ScrollRevealItem key={feature.title} className="text-center">
                <div className="bg-muted text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <feature.Icon className="h-6 w-6" />
                </div>
                <h3 className="text-foreground mt-5 font-serif text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      <section className="border-border/60 bg-muted/40 border-t px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="text-foreground font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {t('pricingTitle')}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
              {t('pricingSubtitle')}
            </p>
          </ScrollReveal>
          <Card className="border-border bg-card mx-auto mt-12 max-w-md rounded-2xl border shadow-sm">
            <CardContent className="p-10 text-start">
              <div className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                {t('pricingFirstFree')}
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-foreground font-serif text-5xl font-bold">{'\u20AA49'}</span>
                <span className="text-muted-foreground text-base font-medium">
                  / {t('pricingPerDoc')}
                </span>
              </div>
              <p className="text-muted-foreground mt-8 text-xs font-semibold tracking-wider uppercase">
                {t('pricingIncludes')}
              </p>
              <ul className="mt-4 space-y-3">
                {pricingIncludes.map((line) => (
                  <li
                    key={line}
                    className="text-foreground/90 flex items-start gap-3 text-sm leading-relaxed"
                  >
                    <Check className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link href={'/register' as '/templates'} className="mt-8 block">
                <Button
                  size="lg"
                  className="group h-11 w-full rounded-md text-base font-semibold shadow-sm"
                >
                  {t('heroCta')}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-border/60 bg-background border-t px-4 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-foreground font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {t('finalCta')}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
            {t('finalCtaDesc')}
          </p>
          <Link href={'/register' as '/templates'} className="mt-8 inline-block">
            <Button
              size="lg"
              className="group h-11 rounded-md px-6 text-base font-semibold shadow-sm"
            >
              {t('finalCtaButton')}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Button>
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
