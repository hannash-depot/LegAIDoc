import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const WizardContainer = dynamic(
  () => import('@/components/wizard/wizard-container').then((m) => m.WizardContainer),
  {
    loading: () => <div className="bg-muted h-[600px] animate-pulse rounded-lg" />,
  },
);
import { ensureV1 } from '@/lib/templates/compiler';
import type { TemplateDefinitionType } from '@/schemas/template-definition';
import { getLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { redirect } from '@/i18n/navigation';

type PageProps = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function WizardPage({ params, searchParams }: PageProps) {
  const { templateId } = await params;
  const { edit: editDocumentId } = await searchParams;
  const locale = await getLocale();

  const template = await db.template.findUnique({
    where: { id: templateId, isActive: true },
    include: {
      category: {
        select: {
          legalRules: true,
        },
      },
    },
  });

  if (!template) {
    notFound();
  }

  const definition = ensureV1(
    template.definition as unknown as TemplateDefinitionType,
    `${template.id}:${template.version}`,
  );

  // Get localized template name
  const nameKey =
    `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof template;
  const templateName = (template[nameKey] as string) || template.nameEn;

  // Parse legal rules
  const legalRules = template.category?.legalRules
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (template.category.legalRules as any)
    : { rules: [] };

  // Edit mode: load existing document data
  let documentId: string | undefined;
  let initialData: Record<string, unknown> | undefined;

  if (editDocumentId) {
    const session = await auth();
    if (!session?.user?.id) {
      redirect({ href: '/login', locale });
      return null;
    }

    const document = await db.document.findUnique({
      where: { id: editDocumentId },
      select: {
        id: true,
        userId: true,
        templateId: true,
        status: true,
        wizardData: true,
      },
    });

    // Verify document exists, belongs to user, is DRAFT, and matches template
    if (
      document &&
      document.userId === session.user.id &&
      document.status === 'DRAFT' &&
      document.templateId === templateId
    ) {
      documentId = document.id;
      initialData = document.wizardData as Record<string, unknown>;
    } else {
      // Invalid edit request — redirect to documents list
      redirect({ href: '/documents', locale });
      return null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
      <h1 className="text-gradient mb-6 text-2xl font-bold">{templateName}</h1>
      <WizardContainer
        templateId={template.id}
        templateName={templateName}
        definition={definition}
        legalRules={legalRules}
        documentId={documentId}
        initialData={initialData}
      />
    </div>
  );
}
