import { generatePdfFromHtml } from './src/lib/payments/pdf-service';
import * as fs from 'fs';

async function run() {
  console.log('Starting PDF generation test...');
  try {
    const html = `
            <!DOCTYPE html>
            <html lang="he" dir="rtl">
            <head><meta charset="utf-8"><title>Test</title></head>
            <body><h1>שלום עולם</h1><p>This is a test PDF.</p></body>
            </html>
        `;
    const pdfBuffer = await generatePdfFromHtml(html);
    fs.writeFileSync('/tmp/test-invoice.pdf', pdfBuffer);
    console.log('PDF generated successfully! Size:', pdfBuffer.length, 'bytes');
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    process.exit(1);
  }
}

run();
