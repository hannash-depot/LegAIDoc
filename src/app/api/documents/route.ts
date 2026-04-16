import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { ensureV1 } from '@/lib/templates/compiler';
import { renderTemplate } from '@/lib/templates/renderer';
import { TemplateDefinition } from '@/schemas/template-definition';
import type { Locale } from '@/lib/utils/locale';
import { getUserUsage } from '@/lib/payments/usage-limits';
import { FEATURE_PAYMENTS } from '@/lib/feature-flags';
import { z } from 'zod/v4';

const CreateDocumentSchema = z.object({
  templateId: z.string().min(1),
  wizardData: z.record(z.string(), z.unknown()),
  locale: z.enum(['he', 'ar', 'en', 'ru']).default('he'),
});

// POST /api/documents — Create document + generate PDF
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CreateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const { templateId, wizardData, locale } = parsed.data;

    // Check plan usage limits when payments are enabled
    if (FEATURE_PAYMENTS) {
      const usage = await getUserUsage(session!.user!.id!);
      if (usage.hasActiveSubscription && !usage.canCreateDocument) {
        return error('Document limit reached for your plan', 403, 'DOCUMENT_LIMIT_REACHED');
      }
    }

    // Fetch template
    const template = await db.template.findUnique({
      where: { id: templateId, isActive: true },
    });

    if (!template) {
      return error('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    // Validate and compile template definition to v1
    const defParsed = TemplateDefinition.safeParse(template.definition);
    if (!defParsed.success) {
      logger.error('Invalid template definition', { templateId, issues: defParsed.error.issues });
      return error('Template definition is invalid', 500, 'TEMPLATE_INVALID');
    }
    const definition = ensureV1(defParsed.data, `${template.id}:${template.version}`);

    // Render the template with wizard data
    const renderedBody = renderTemplate(definition, wizardData, locale as Locale);

    // Get localized template name for the document title
    const nameKey =
      `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof template;
    const title = (template[nameKey] as string) || template.nameEn;

    // Generate ID upfront so we can set pdfUrl in a single create
    const docId = crypto.randomUUID();

    // Create document record
    const document = await db.document.create({
      data: {
        id: docId,
        title,
        userId: session!.user!.id!,
        templateId,
        templateVersion: template.version,
        wizardData: JSON.parse(JSON.stringify(wizardData)),
        renderedBody,
        pdfUrl: `/api/documents/${docId}/pdf`,
        status: 'DRAFT',
        locale,
      },
    });

    return success(document, 201);
  } catch (err) {
    logger.error('Document creation error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
