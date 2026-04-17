import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/require-admin';
import { error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { extractText, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/ai/text-extractor';
import { maskPii } from '@/lib/ai/pii-masker';
import { parseDocumentWithLlm, type LlmProvider } from '@/lib/ai/llm-parser';
import { logAudit } from '@/lib/audit/audit-trail';
import { FEATURE_AI_IMPORT } from '@/lib/feature-flags';

/**
 * POST /api/admin/ai-parse
 * AISP-01: Accept file upload, extract text, mask PII, parse with LLM.
 *
 * Response modes:
 *  - Early validation failures (auth, feature flag, bad file) → normal
 *    JSON envelope via `success`/`error` helpers.
 *  - Success path → `application/x-ndjson` stream of one JSON event per line.
 *    Event shapes:
 *      { type: 'status', stage: string }
 *      { type: 'delta',  text: string }            // LLM output tokens
 *      { type: 'done',   data: <parse envelope> }  // terminal success
 *      { type: 'error',  message: string, code: string } // terminal failure
 */
export async function POST(request: NextRequest) {
  if (!FEATURE_AI_IMPORT) return error('AI Import is not enabled', 403, 'FEATURE_DISABLED');

  const { error: authError, session } = await requireAdmin(request);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return error('No file uploaded', 400, 'NO_FILE');
  }

  if (!SUPPORTED_FILE_TYPES.includes(file.type as (typeof SUPPORTED_FILE_TYPES)[number])) {
    return error(
      `Unsupported file type: ${file.type}. Supported: PDF, DOCX, TXT`,
      400,
      'UNSUPPORTED_TYPE',
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return error(`File too large. Maximum: 50MB`, 400, 'FILE_TOO_LARGE');
  }

  const apiKey = formData.get('apiKey') as string | undefined;
  const provider = (formData.get('provider') as LlmProvider | undefined) || 'claude';
  const validProviders: LlmProvider[] = ['openai', 'claude', 'gemini'];
  if (!validProviders.includes(provider)) {
    return error(`Invalid provider: ${provider}`, 400, 'INVALID_PROVIDER');
  }

  // Capture values used inside the stream closure before the request object
  // is released.
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.type;
  const fileName = file.name;
  const fileSize = file.size;
  const userId = session!.user!.id!;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(ev) + '\n'));
      };

      try {
        send({ type: 'status', stage: 'extracting' });
        const { text, pageCount } = await extractText(buffer, fileType);

        if (!text.trim()) {
          send({
            type: 'error',
            message: 'No text could be extracted from this file',
            code: 'NO_TEXT',
          });
          controller.close();
          return;
        }

        send({ type: 'status', stage: 'masking' });
        const { maskedText, tokenMap } = maskPii(text);
        const piiMaskedCount = tokenMap.size;

        const parseResult = await parseDocumentWithLlm(
          maskedText,
          provider,
          apiKey || undefined,
          (ev) => send(ev),
        );

        await logAudit('ai.parse', 'template', null, userId, {
          fileName,
          fileSize,
          pageCount,
          piiMaskedCount,
          provider,
          confidence: parseResult.confidence,
          errorCount: parseResult.errors.length,
          parseTokens: parseResult.tokenUsage?.parse,
          translateTokens: parseResult.tokenUsage?.translate,
        });

        send({
          type: 'done',
          data: {
            originalText: text,
            maskedText,
            piiMaskedCount,
            definition: parseResult.definition,
            confidence: parseResult.confidence,
            errors: parseResult.errors,
            errorKind: parseResult.errorKind,
            rawResponse: parseResult.rawResponse,
            tokenUsage: parseResult.tokenUsage,
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;

        logger.error('AI parse error', err);

        try {
          await logAudit('ai.parse.error', 'template', null, userId || 'system', {
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
          });
        } catch {
          // audit logging failure must not mask the real error
        }

        send({
          type: 'error',
          message:
            process.env.NODE_ENV === 'development'
              ? `AI parse error: ${errorMessage}`
              : 'Internal server error',
          code: 'INTERNAL_ERROR',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
