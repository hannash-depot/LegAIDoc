'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  ProfileUpdateSchema,
  PasswordChangeSchema,
  NotificationPrefsSchema,
} from '@/schemas/account';
import type {
  ProfileUpdateInput,
  PasswordChangeInput,
  NotificationPrefsInput,
} from '@/schemas/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Check, ShieldCheck, ShieldOff } from 'lucide-react';
import { DeleteAccountDialog } from './delete-account-dialog';

interface SettingsFormProps {
  name: string;
  email: string;
  preferredLocale: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  hasPassword: boolean;
  companyName: string | null;
  idNumber: string | null;
  address: string | null;
  phone: string | null;
  isAdmin?: boolean;
  mfaEnabled?: boolean;
}

const LOCALE_LABELS: Record<string, string> = {
  he: 'עברית',
  ar: 'العربية',
  en: 'English',
  ru: 'Русский',
};

export function SettingsForm({
  name,
  email,
  preferredLocale,
  emailNotifications,
  inAppNotifications,
  hasPassword,
  companyName,
  idNumber,
  address,
  phone,
  isAdmin,
  mfaEnabled,
}: SettingsFormProps) {
  const t = useTranslations('account');
  const router = useRouter();

  return (
    <div className="space-y-6">
      <ProfileSection
        name={name}
        email={email}
        preferredLocale={preferredLocale}
        companyName={companyName}
        idNumber={idNumber}
        address={address}
        phone={phone}
      />
      {hasPassword && <PasswordSection />}
      {isAdmin && <MfaSection mfaEnabled={mfaEnabled ?? false} />}
      <NotificationsSection
        emailNotifications={emailNotifications}
        inAppNotifications={inAppNotifications}
      />
      <DangerZoneSection />
    </div>
  );

  function ProfileSection({
    name,
    email,
    preferredLocale,
    companyName,
    idNumber,
    address,
    phone,
  }: {
    name: string;
    email: string;
    preferredLocale: string;
    companyName: string | null;
    idNumber: string | null;
    address: string | null;
    phone: string | null;
  }) {
    const [saved, setSaved] = useState(false);

    const form = useForm<ProfileUpdateInput>({
      resolver: zodResolver(ProfileUpdateSchema),
      defaultValues: {
        name,
        preferredLocale: preferredLocale as ProfileUpdateInput['preferredLocale'],
        companyName: companyName || '',
        idNumber: idNumber || '',
        address: address || '',
        phone: phone || '',
      },
    });

    async function onSubmit(values: ProfileUpdateInput) {
      setSaved(false);
      try {
        const res = await fetch('/api/account/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || t('errors.updateFailed'));
        }

        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : t('errors.updateFailed'),
        });
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSection')}</CardTitle>
          <CardDescription>{t('profileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <div className="text-destructive text-sm font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t('emailLabel')}</FormLabel>
                <Input value={email} disabled dir="ltr" />
                <p className="text-muted-foreground text-xs">{t('emailReadOnly')}</p>
              </div>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('companyNameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('companyNamePlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('idNumberLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('idNumberPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addressLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('addressPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phoneLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        {...field}
                        value={field.value || ''}
                        placeholder={t('phonePlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredLocale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('localeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LOCALE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('saveProfile')}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {t('profileUpdated')}
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  function PasswordSection() {
    const [saved, setSaved] = useState(false);

    const form = useForm<PasswordChangeInput>({
      resolver: zodResolver(PasswordChangeSchema),
      defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    async function onSubmit(values: PasswordChangeInput) {
      setSaved(false);
      try {
        const res = await fetch('/api/account/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.error?.code === 'INVALID_PASSWORD') {
            form.setError('currentPassword', {
              message: t('errors.invalidCurrentPassword'),
            });
            return;
          }
          throw new Error(data.error?.message || t('errors.updateFailed'));
        }

        setSaved(true);
        form.reset();
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : t('errors.updateFailed'),
        });
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('passwordSection')}</CardTitle>
          <CardDescription>{t('passwordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <div className="text-destructive text-sm font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('currentPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('savePassword')}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {t('passwordChanged')}
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  function NotificationsSection({
    emailNotifications,
    inAppNotifications,
  }: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
  }) {
    const [saved, setSaved] = useState(false);

    const form = useForm<NotificationPrefsInput>({
      resolver: zodResolver(NotificationPrefsSchema),
      defaultValues: { emailNotifications, inAppNotifications },
    });

    async function onSubmit(values: NotificationPrefsInput) {
      setSaved(false);
      try {
        const res = await fetch('/api/account/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || t('errors.updateFailed'));
        }

        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : t('errors.updateFailed'),
        });
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationsSection')}</CardTitle>
          <CardDescription>{t('notificationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <div className="text-destructive text-sm font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('emailNotifications')}</FormLabel>
                      <FormDescription>{t('emailNotificationsDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inAppNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('inAppNotifications')}</FormLabel>
                      <FormDescription>{t('inAppNotificationsDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <p className="text-muted-foreground text-xs">{t('notificationsComingSoon')}</p>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('saveNotifications')}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {t('notificationsUpdated')}
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  function MfaSection({ mfaEnabled: initialMfaEnabled }: { mfaEnabled: boolean }) {
    const [mfaState, setMfaState] = useState<'idle' | 'setup' | 'verify' | 'disable'>(
      initialMfaEnabled ? 'idle' : 'idle',
    );
    const [isMfaEnabled, setIsMfaEnabled] = useState(initialMfaEnabled);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verifyToken, setVerifyToken] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaError, setMfaError] = useState('');

    const handleSetup = async () => {
      setMfaLoading(true);
      setMfaError('');
      try {
        const res = await fetch('/api/account/mfa/setup', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setMfaError(data.error?.message || t('mfa.setupError'));
          return;
        }
        setQrCodeUrl(data.data.qrCodeDataUrl);
        setSecret(data.data.secret);
        setMfaState('verify');
      } catch {
        setMfaError(t('mfa.setupError'));
      } finally {
        setMfaLoading(false);
      }
    };

    const handleVerify = async () => {
      setMfaLoading(true);
      setMfaError('');
      try {
        const res = await fetch('/api/account/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verifyToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMfaError(data.error?.message || t('mfa.verifyError'));
          return;
        }
        setIsMfaEnabled(true);
        setMfaState('idle');
        setVerifyToken('');
        router.refresh();
      } catch {
        setMfaError(t('mfa.verifyError'));
      } finally {
        setMfaLoading(false);
      }
    };

    const handleDisable = async () => {
      setMfaLoading(true);
      setMfaError('');
      try {
        const res = await fetch('/api/account/mfa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: disablePassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMfaError(data.error?.message || t('mfa.disableError'));
          return;
        }
        setIsMfaEnabled(false);
        setMfaState('idle');
        setDisablePassword('');
        router.refresh();
      } catch {
        setMfaError(t('mfa.disableError'));
      } finally {
        setMfaLoading(false);
      }
    };

    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('mfa.section')}
          </CardTitle>
          <CardDescription>{t('mfa.sectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaError && (
            <div className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm font-medium">
              {mfaError}
            </div>
          )}

          {/* Status display */}
          <div className="flex items-center gap-3 rounded-lg border p-4">
            {isMfaEnabled ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">{t('mfa.enabled')}</p>
                  <p className="text-muted-foreground text-sm">{t('mfa.enabledDesc')}</p>
                </div>
              </>
            ) : (
              <>
                <ShieldOff className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-500">{t('mfa.disabled')}</p>
                  <p className="text-muted-foreground text-sm">{t('mfa.disabledDesc')}</p>
                </div>
              </>
            )}
          </div>

          {/* Setup / Verify flow */}
          {mfaState === 'idle' && !isMfaEnabled && (
            <Button onClick={handleSetup} disabled={mfaLoading}>
              {mfaLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('mfa.setupButton')}
            </Button>
          )}

          {mfaState === 'verify' && (
            <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">{t('mfa.scanQr')}</p>
              {qrCodeUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="QR Code" width={200} height={200} />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">{t('mfa.manualEntry')}</p>
                <code className="bg-muted block rounded p-2 font-mono text-xs break-all select-all">
                  {secret}
                </code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('mfa.enterCode')}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="max-w-[200px] text-center text-xl tracking-widest"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleVerify} disabled={mfaLoading || verifyToken.length !== 6}>
                  {mfaLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('mfa.verifyButton')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMfaState('idle');
                    setMfaError('');
                  }}
                >
                  {t('mfa.cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Disable flow */}
          {isMfaEnabled && mfaState === 'idle' && (
            <Button variant="outline" onClick={() => setMfaState('disable')}>
              {t('mfa.disableButton')}
            </Button>
          )}

          {mfaState === 'disable' && (
            <div className="border-destructive/30 space-y-4 rounded-lg border p-4">
              <p className="text-destructive text-sm font-medium">{t('mfa.disableWarning')}</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('mfa.enterPassword')}</label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={mfaLoading || !disablePassword}
                >
                  {mfaLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('mfa.confirmDisable')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMfaState('idle');
                    setMfaError('');
                    setDisablePassword('');
                  }}
                >
                  {t('mfa.cancel')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function DangerZoneSection() {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
          <CardDescription>{t('dangerZoneDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{t('deleteAccount')}</p>
              <p className="text-muted-foreground text-sm">{t('deleteConfirmation')}</p>
            </div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    );
  }
}
