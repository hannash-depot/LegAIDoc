import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export class PdfGenerationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PdfGenerationError';
  }
}

// ─── Browser singleton ──────────────────────────────────────────
// Reuse a single Chromium instance across requests instead of
// launching + closing one per PDF (saves ~1-3s per generation).

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance;
  if (browserLaunchPromise) return browserLaunchPromise;

  const isDev = process.env.NODE_ENV === 'development';

  browserLaunchPromise = puppeteer
    .launch({
      args: isDev ? [] : chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: isDev ? getLocalChromePath() : await chromium.executablePath(),
      headless: true,
    })
    .then((browser) => {
      browserInstance = browser;
      browser.on('disconnected', () => {
        browserInstance = null;
      });
      browserLaunchPromise = null;
      return browser;
    })
    .catch((err) => {
      browserLaunchPromise = null;
      throw err;
    });

  return browserLaunchPromise;
}

/**
 * Converts an HTML string into a PDF buffer.
 * Uses a shared Chromium instance for performance.
 * Uses @sparticuz/chromium for Vercel serverless compatibility,
 * with fallback to local Chrome for development.
 */
export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Use 'domcontentloaded' instead of 'networkidle0' — the HTML is
    // self-contained with no external network requests to wait for.
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15_000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm',
      },
      timeout: 30_000,
    });

    return pdfBuffer;
  } catch (err) {
    // Reset browser singleton if it disconnected
    if (browserInstance && !browserInstance.connected) {
      browserInstance = null;
    }
    throw new PdfGenerationError(
      `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Returns path to locally installed Chrome/Chromium for development.
 */
function getLocalChromePath(): string {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'linux':
      return '/usr/bin/google-chrome';
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    default:
      return '/usr/bin/google-chrome';
  }
}

// Graceful cleanup on process termination
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    if (browserInstance) {
      await browserInstance.close().catch(() => {});
      browserInstance = null;
    }
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}
