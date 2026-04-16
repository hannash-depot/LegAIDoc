'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import { ForgotPasswordSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = { email: formData.get('email') as string };

    const parsed = ForgotPasswordSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch {
      setErrors({ email: t('forgotPassword.error') });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t('forgotPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{t('forgotPassword.successMessage')}</p>
          <Link
            href="/login"
            className="text-primary mt-4 inline-block font-medium hover:underline"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('forgotPassword.title')}</CardTitle>
        <CardDescription>{t('forgotPassword.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-foreground block text-base font-medium">{t('email')}</label>
            <Input
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-destructive text-base" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '...' : t('forgotPassword.submitButton')}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-base">
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
