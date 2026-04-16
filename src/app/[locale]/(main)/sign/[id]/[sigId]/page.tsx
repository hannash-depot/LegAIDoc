import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { SignatureFlow } from '@/components/signature/signature-flow';

interface SignPageProps {
  params: Promise<{
    locale: string;
    id: string; // Document ID
    sigId: string; // Signatory ID
  }>;
}

export default async function SignPage({ params }: SignPageProps) {
  const { id: documentId, sigId: signatoryId } = await params;
  const t = await getTranslations('signatureFlow');

  const document = await db.document.findUnique({
    where: { id: documentId },
    include: {
      signatories: true,
    },
  });

  if (!document) {
    return notFound();
  }

  const signatory = document.signatories.find((s) => s.id === signatoryId);

  if (!signatory) {
    return notFound();
  }

  // Document must be pending signature or already signed
  if (document.status !== 'PENDING_SIGNATURE' && document.status !== 'SIGNED') {
    return (
      <div className="bg-muted mx-auto mt-20 max-w-2xl rounded-xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t('invalidStatusTitle')}</h1>
        <p className="text-muted-foreground">{t('invalidStatusDesc')}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <SignatureFlow
        documentId={document.id}
        signatoryId={signatory.id}
        documentTitle={document.title}
        signatoryName={signatory.name}
        signatoryEmail={signatory.email}
        renderedBody={document.renderedBody || ''}
        alreadySigned={!!signatory.signedAt}
      />
    </div>
  );
}
