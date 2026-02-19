import { renderContractHtml } from "./html-renderer";
import type { TemplateDefinition } from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";

export async function generatePdf(
  definition: TemplateDefinition,
  data: Record<string, unknown>,
  locale: Locale
): Promise<Buffer> {
  const html = renderContractHtml(definition, data, locale);

  let browser;

  if (process.env.NODE_ENV === "production") {
    // Production: use @sparticuz/chromium-min for serverless
    const chromium = await import("@sparticuz/chromium-min");
    const puppeteer = await import("puppeteer-core");

    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar"
      ),
      headless: true,
    });
  } else {
    // Development: use full puppeteer
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Wait for fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
