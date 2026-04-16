'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { LoginSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SocialAuth } from '@/components/auth/social-auth';
import { SiteLogo } from '@/components/layout/site-logo';
import { useLogoSettings } from '@/components/layout/logo-provider';

export default function LoginPage() {
  const t = useTranslations('auth');
  const { logoUrl, logoHeight } = useLogoSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // PRIV-02: MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

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
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const parsed = LoginSchema.safeParse(data);
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
      // First, attempt login to validate credentials
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(t('errors.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      // Check if MFA is required for this user
      const mfaCheck = await fetch('/api/auth/mfa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const mfaData = await mfaCheck.json();

      if (mfaData.data?.mfaRequired) {
        // MFA required — show TOTP input
        setPendingCredentials(data);
        setMfaRequired(true);
        setIsLoading(false);
        return;
      }

      // No MFA needed — complete login
      router.push('/templates');
      router.refresh();
    } catch {
      setServerError(t('errors.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingCredentials) return;
    setServerError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingCredentials.email, token: mfaToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.data?.verified) {
        setServerError(t('mfa.invalidCode'));
        setIsLoading(false);
        return;
      }

      // MFA verified — session already created by initial signIn, navigate
      router.push('/templates');
      router.refresh();
    } catch {
      setServerError(t('mfa.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  // PRIV-02: MFA challenge screen
  if (mfaRequired) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 flex justify-center">
            <SiteLogo logoUrl={logoUrl} height={logoHeight + 8} />
          </Link>
          <CardTitle>{t('mfa.title')}</CardTitle>
          <CardDescription>{t('mfa.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMfaSubmit} className="space-y-4" noValidate>
            {serverError && (
              <div
                className="bg-destructive/10 text-destructive rounded-lg p-4 text-base"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <div className="mx-auto max-w-sm space-y-2">
              <label className="text-foreground block text-base font-medium">
                {t('mfa.codeLabel')}
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="py-6 text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || mfaToken.length !== 6}>
              {isLoading ? '...' : t('mfa.verifyButton')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMfaRequired(false);
                setPendingCredentials(null);
                setMfaToken('');
                setServerError('');
              }}
            >
              {t('mfa.backToLogin')}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 flex justify-center">
          <SiteLogo logoUrl={logoUrl} height={logoHeight + 8} />
        </Link>
        <CardTitle>{t('loginTitle')}</CardTitle>
        <CardDescription>{t('orContinueWith')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <SocialAuth />

          {serverError && (
            <div
              className="bg-destructive/10 text-destructive rounded-lg p-4 text-base"
              role="alert"
            >
              {serverError}
            </div>
          )}

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

          <div className="space-y-1.5">
            <label className="text-foreground block text-base font-medium">{t('password')}</label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-destructive text-base" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '...' : t('loginButton')}
          </Button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-primary text-sm hover:underline"
            >
              {t('forgotPasswordLink')}
            </Link>
          </div>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-base">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {t('registerLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
