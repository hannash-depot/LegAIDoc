import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { ensureV1 } from '@/lib/templates/compiler';
import { logger } from '@/lib/logger';
import type { TemplateDefinitionType } from '@/schemas/template-definition';
import type { NextRequest } from 'next/server';

// TMPL-09: GET public templates (active only, in active categories)
async function handler(request: NextRequest) {
  void request;
  try {
    const templates = await db.template.findMany({
      where: {
        isActive: true,
        category: { isActive: true },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            nameHe: true,
            nameAr: true,
            nameEn: true,
            nameRu: true,
            descHe: true,
            descAr: true,
            descEn: true,
            descRu: true,
          },
        },
      },
    });

    // Compile v2 definitions to v1 for public consumption
    const compiled = templates.map((t) => ({
      ...t,
      definition: ensureV1(
        t.definition as unknown as TemplateDefinitionType,
        `${t.id}:${t.version}`,
      ),
    }));

    return success(compiled);
  } catch (err) {
    logger.error('Failed to fetch public templates', err);
    return error('Failed to fetch templates', 500, 'INTERNAL_ERROR');
  }
}

export const GET = withRateLimit(handler, { namespace: 'templates:public' });
