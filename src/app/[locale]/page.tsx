import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { FileText, Languages, Scale, Zap, Check, ArrowRight } from 'lucide-react';
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from '@/components/ui/scroll-reveal';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  const t = await getTranslations('landing');

  return (
    <main className="flex min-h-screen flex-col">
      {/* Top bar with logo and language switcher */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-primary font-serif text-xl font-bold">LegAIDoc</span>
        <LocaleSwitcher />
      </div>

      {/* Hero */}
      <section className="from-primary/5 via-background to-background relative overflow-hidden bg-gradient-to-b px-4 py-24 sm:py-32">
        <ScrollReveal className="mx-auto max-w-4xl text-center">
          <h1 className="text-gradient pb-2 font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href={'/register' as '/templates'}>
              <Button
                size="lg"
                className="group h-12 rounded-full px-8 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t('heroCta')}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href={'/templates' as const}>
              <Button
                variant="ghost"
                size="lg"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 h-12 rounded-full border-2 px-8 text-base font-semibold transition-all"
              >
                <FileText className="size-4" />
                {t('heroCtaSecondary')}
              </Button>
            </Link>
          </div>
        </ScrollReveal>
        <div className="bg-ambient bg-primary/20 top-20 left-1/2 -ml-[400px] h-[400px] w-[800px]"></div>
      </section>

      {/* How It Works */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-foreground mb-16 text-center font-serif text-4xl font-bold">
              {t('howItWorksTitle')}
            </h2>
          </ScrollReveal>
          <ScrollRevealGroup className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              { num: '1', title: t('step1Title'), desc: t('step1Desc'), icon: FileText },
              { num: '2', title: t('step2Title'), desc: t('step2Desc'), icon: Zap },
              { num: '3', title: t('step3Title'), desc: t('step3Desc'), icon: FileText },
            ].map((step) => (
              <ScrollRevealItem key={step.num} className="group text-center">
                <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.15)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                  {step.num}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-border/50 relative overflow-hidden border-y px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="mb-16 text-center font-serif text-4xl font-bold">
              {t('featuresTitle')}
            </h2>
          </ScrollReveal>
          <ScrollRevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { title: t('featureBilingual'), desc: t('featureBilingualDesc'), icon: Languages },
              { title: t('featureLegal'), desc: t('featureLegalDesc'), icon: Scale },
              { title: t('featureInstant'), desc: t('featureInstantDesc'), icon: Zap },
              { title: t('featureAffordable'), desc: t('featureAffordableDesc'), icon: FileText },
            ].map((feature) => (
              <ScrollRevealItem key={feature.title}>
                <Card className="border-border/40 bg-background/60 h-full backdrop-blur-sm">
                  <CardContent className="flex items-start gap-5 p-8">
                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
        <div className="bg-ambient right-[-200px] bottom-0 h-[600px] w-[600px] bg-blue-500/10 dark:bg-blue-600/5"></div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-lg text-center">
          <ScrollReveal>
            <h2 className="mb-4 font-serif text-4xl font-bold">{t('pricingTitle')}</h2>
            <div className="mt-12">
              <Card className="border-primary/50 ring-primary/20 relative overflow-hidden shadow-2xl ring-1">
                <div className="from-primary absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-blue-400"></div>
                <CardContent className="p-10">
                  <div className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
                    {t('pricingFirstFree')}
                  </div>
                  <div className="mt-4 flex items-baseline justify-center gap-2">
                    <span className="text-foreground font-serif text-6xl font-bold">
                      {'\u20AA49'}
                    </span>
                    <span className="text-muted-foreground text-lg font-medium">
                      / {t('pricingPerDoc')}
                    </span>
                  </div>
                  <ul className="mt-10 space-y-4 text-start">
                    <li className="text-foreground mb-6 text-sm font-semibold tracking-wider uppercase">
                      {t('pricingIncludes')}
                    </li>
                    {[
                      t('pricingFeature1'),
                      t('pricingFeature2'),
                      t('pricingFeature3'),
                      t('pricingFeature4'),
                    ].map((f) => (
                      <li
                        key={f}
                        className="text-muted-foreground flex items-center gap-3 text-base"
                      >
                        <div className="bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                          <Check className="text-primary h-3.5 w-3.5" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={'/register' as '/templates'} className="mt-10 block">
                    <Button
                      size="lg"
                      className="group h-12 w-full rounded-full text-base font-semibold shadow-lg transition-all hover:shadow-xl"
                    >
                      {t('heroCta')}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 border-border/50 border-t px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="mb-16 text-center font-serif text-4xl font-bold">{t('faqTitle')}</h2>
          </ScrollReveal>
          <ScrollRevealGroup className="space-y-6">
            {[
              { q: t('faq1Q'), a: t('faq1A') },
              { q: t('faq2Q'), a: t('faq2A') },
              { q: t('faq3Q'), a: t('faq3A') },
              { q: t('faq4Q'), a: t('faq4A') },
            ].map((faq) => (
              <ScrollRevealItem key={faq.q}>
                <div className="border-border/40 bg-background rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="mb-3 text-lg font-semibold">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-24">
        <ScrollReveal className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="bg-primary/5 border-primary/10 rounded-3xl border p-12 shadow-xl backdrop-blur-sm md:p-16">
            <h2 className="mb-6 font-serif text-4xl font-bold md:text-5xl">{t('finalCta')}</h2>
            <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl">
              {t('finalCtaDesc')}
            </p>
            <Link href={'/register' as '/templates'}>
              <Button
                size="lg"
                className="group h-14 rounded-full px-10 text-base font-semibold shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {t('heroCta')}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
        <div className="bg-ambient bg-primary/20 top-[10%] left-[20%] h-[300px] w-[300px]"></div>
        <div className="bg-ambient right-[20%] bottom-[10%] h-[400px] w-[400px] bg-blue-400/10"></div>
      </section>
    </main>
  );
}
