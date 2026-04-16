/**
 * Re-export the shared PDF generator.
 *
 * The canonical implementation lives in `@/lib/pdf/generator.ts` and already
 * handles puppeteer-core + @sparticuz/chromium, browser singleton reuse,
 * and graceful cleanup. No need to duplicate that logic here.
 */
export { generatePdfFromHtml } from '@/lib/pdf/generator';
