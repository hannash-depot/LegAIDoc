'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { RegisterSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SocialAuth } from '@/components/auth/social-auth';
import { SiteLogo } from '@/components/layout/site-logo';
import { useLogoSettings } from '@/components/layout/logo-provider';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const { logoUrl, logoHeight } = useLogoSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setServerError(t('errors.invalidCredentials'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const parsed = RegisterSchema.safeParse(data);
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setServerError(t('errors.emailExists'));
        } else {
          setServerError(json.error?.message || t('errors.invalidCredentials'));
        }
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but login failed — redirect to login
        router.push('/login');
      } else {
        router.push('/templates');
        router.refresh();
      }
    } catch {
      setServerError(t('errors.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 flex justify-center">
          <SiteLogo logoUrl={logoUrl} height={logoHeight + 8} />
        </Link>
        <CardTitle>{t('registerTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <SocialAuth />

          {serverError && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm" role="alert">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">{t('name')}</label>
            <Input
              name="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              required
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-sm" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">{t('email')}</label>
            <Input
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-destructive text-sm" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">{t('password')}</label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-destructive text-sm" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '...' : t('registerButton')}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
