import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/api/require-admin';
import { getLogoSettings } from '@/lib/settings/get-logo';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogoUploadForm } from './_components/logo-upload-form';
import { LlmSettingsForm } from './_components/llm-settings-form';

export default async function AdminSettingsPage() {
  const { error } = await requireAdmin();
  if (error) return null;

  const t = await getTranslations('admin');
  const logoSettings = await getLogoSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground mt-2">{t('settingsDescription')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('logoSettings')}</CardTitle>
            <CardDescription>{t('logoSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUploadForm initialSettings={logoSettings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('llmSettings')}</CardTitle>
            <CardDescription>{t('llmSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LlmSettingsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
