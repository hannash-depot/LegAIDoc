import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadBlob } from '@/lib/storage/blob';
import { extractText, SUPPORTED_FILE_TYPES } from '@/lib/ai/text-extractor';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'No file provided' } },
        { status: 400 },
      );
    }

    if (!(SUPPORTED_FILE_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNSUPPORTED_TYPE', message: 'Unsupported file type' } },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text
    const { text } = await extractText(buffer, file.type);
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message:
              'Could not extract text from document. Document may be an image/scanned PDF without OCR.',
          },
        },
        { status: 400 },
      );
    }

    // Upload to Vercel string
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 8);
    const fileName = `imported-contracts/${session.user.id}/${hash}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blobUrl = await uploadBlob(fileName, buffer, file.type);

    // Store
    const importedContract = await db.importedContract.create({
      data: {
        userId: session.user.id,
        title: file.name,
        blobUrl: blobUrl,
        extractedText: text,
      },
    });

    return NextResponse.json({ success: true, data: { id: importedContract.id } });
  } catch (error) {
    logger.error('Upload error', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } },
      { status: 500 },
    );
  }
}
