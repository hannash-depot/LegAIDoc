import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFoundPage() {
  let title = 'הדף לא נמצא';
  let description = 'הדף שחיפשת אינו קיים או הוסר.';
  let backText = 'חזרה לדף הבית';

  try {
    const t = await getTranslations('common');
    title = t('notFoundTitle');
    description = t('notFoundDescription');
    backText = t('backToHome');
  } catch {
    // Fallback to Hebrew defaults above
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-muted-foreground text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
      >
        {backText}
      </Link>
    </div>
  );
}
