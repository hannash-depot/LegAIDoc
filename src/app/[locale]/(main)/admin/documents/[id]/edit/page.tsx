import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { ensureV1 } from '@/lib/templates/compiler';
import type { TemplateDefinitionType } from '@/schemas/template-definition';
import { AdminDocumentEditor } from './_components/admin-document-editor';

type Params = { params: Promise<{ id: string }> };

export default async function AdminDocumentEditPage({ params }: Params) {
  await requireAdmin();
  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      template: {
        include: {
          category: {
            select: { legalRules: true },
          },
        },
      },
      signatories: {
        select: { id: true, name: true, email: true, role: true, signedAt: true },
      },
    },
  });

  if (!document) notFound();

  const definition = ensureV1(
    document.template.definition as unknown as TemplateDefinitionType,
    `${document.template.id}:${document.template.version}`,
  );

  // Get localized template name
  const locale = document.locale || 'en';
  const nameKey =
    `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof document.template;
  const templateName = (document.template[nameKey] as string) || document.template.nameEn;

  const legalRules = document.template.category?.legalRules
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.template.category.legalRules as any)
    : { rules: [] };

  return (
    <AdminDocumentEditor
      document={JSON.parse(JSON.stringify(document))}
      definition={definition}
      templateName={templateName}
      legalRules={legalRules}
    />
  );
}
