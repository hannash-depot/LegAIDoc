import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing, getDirection, type Locale } from "@/lib/i18n/routing";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegAIDoc - Legal Documents Made Easy",
  description:
    "Create professional legal contracts in minutes. Templates tailored for Israeli law in Hebrew, Arabic, English, and Russian.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const direction = getDirection(locale as Locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={direction}>
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
