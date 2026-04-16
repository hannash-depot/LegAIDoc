import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { analyzeContract } from '@/lib/ai/analyzer';
import { notifyAnalysisComplete } from '@/lib/notifications';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const importedContract = await db.importedContract.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!importedContract || !importedContract.extractedText) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contract not found or empty' } },
        { status: 404 },
      );
    }

    // Use the default provider (claude) or pass one in the request body
    let provider = 'claude';
    try {
      const body = await req.json();
      if (body.provider && ['openai', 'claude', 'gemini'].includes(body.provider)) {
        provider = body.provider;
      }
    } catch {
      // Ignore JSON parse errors if body is empty
    }

    const analysisResult = await analyzeContract(
      importedContract.extractedText,
      provider as 'openai' | 'claude' | 'gemini',
    );

    // Update DB
    const updated = await db.importedContract.update({
      where: { id },
      data: {
        analysisResult: analysisResult as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    // Notify user that analysis is complete
    notifyAnalysisComplete(session.user.id, importedContract.title, id).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Analysis error', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Analysis failed' } },
      { status: 500 },
    );
  }
}
