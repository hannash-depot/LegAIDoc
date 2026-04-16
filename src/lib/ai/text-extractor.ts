/**
 * AISP-02: Text extraction from PDF, DOCX, and TXT files.
 * Uses pdf-parse for text-based PDFs and mammoth for DOCX.
 */

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; pageCount?: number }> {
  if (mimeType === 'application/pdf' || mimeType.endsWith('.pdf')) {
    return extractFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType.endsWith('.docx')
  ) {
    return extractFromDocx(buffer);
  }

  if (mimeType === 'text/plain' || mimeType.endsWith('.txt')) {
    return { text: buffer.toString('utf-8') };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function extractFromPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (
    buf: Buffer,
  ) => Promise<{ text: string; numpages: number }>;
  const result = await pdfParse(buffer);
  return {
    text: result.text,
    pageCount: result.numpages,
  };
}

async function extractFromDocx(buffer: Buffer): Promise<{ text: string }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value };
}

/**
 * Supported file extensions and MIME types for upload validation.
 */
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
