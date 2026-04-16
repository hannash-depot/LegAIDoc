'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t('resetPassword.passwordMismatch') });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrors({ password: t('resetPassword.passwordTooShort') });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setServerError(data.error?.message || t('resetPassword.error'));
      }
    } catch {
      setServerError(t('resetPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t('resetPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-destructive">{t('resetPassword.invalidLink')}</p>
          <Link
            href="/forgot-password"
            className="text-primary mt-4 inline-block font-medium hover:underline"
          >
            {t('resetPassword.requestNewLink')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t('resetPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{t('resetPassword.successMessage')}</p>
          <Link
            href="/login"
            className="text-primary mt-4 inline-block font-medium hover:underline"
          >
            {t('resetPassword.backToLogin')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('resetPassword.title')}</CardTitle>
        <CardDescription>{t('resetPassword.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && (
            <div
              className="bg-destructive/10 text-destructive rounded-lg p-4 text-base"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-foreground block text-base font-medium">
              {t('resetPassword.newPassword')}
            </label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-destructive text-base" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground block text-base font-medium">
              {t('resetPassword.confirmPassword')}
            </label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-base" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '...' : t('resetPassword.submitButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
