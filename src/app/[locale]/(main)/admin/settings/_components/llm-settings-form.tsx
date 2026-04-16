'use client';

import { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LlmSetting {
  provider: string;
  exists: boolean;
  isActive: boolean;
  maskedKey: string;
}

export function LlmSettingsForm() {
  const t = useTranslations('admin');
  const [settings, setSettings] = useState<LlmSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings/llm');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data);
      }
    } catch (error) {
      clientLogger.error('Failed to fetch LLM settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (provider: string) => {
    const apiKey = newKeys[provider];
    const setting = settings.find((s) => s.provider === provider);

    setIsSaving(provider);
    try {
      const res = await fetch('/api/admin/settings/llm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          isActive: setting?.isActive,
        }),
      });

      if (res.ok) {
        toast.success(t('llmSettingsUpdated'));
        setNewKeys((prev) => ({ ...prev, [provider]: '' }));
        fetchSettings();
      } else {
        toast.error(t('llmSettingsUpdateFailed'));
      }
    } catch {
      toast.error(t('llmSettingsUpdateError'));
    } finally {
      setIsSaving(null);
    }
  };

  const handleToggle = async (provider: string, isActive: boolean) => {
    setSettings((prev) => prev.map((s) => (s.provider === provider ? { ...s, isActive } : s)));

    try {
      const res = await fetch('/api/admin/settings/llm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          isActive,
        }),
      });

      if (!res.ok) {
        toast.error(t('llmSettingsUpdateFailed'));
        fetchSettings(); // Revert
      }
    } catch {
      toast.error(t('llmSettingsUpdateError'));
      fetchSettings(); // Revert
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const providerNames: Record<string, string> = {
    openai: 'GPT-4o (OpenAI)',
    claude: 'Claude 3.5 Sonnet (Anthropic)',
    gemini: 'Gemini 2.0 Flash (Google)',
  };

  return (
    <div className="space-y-6">
      {settings.map((setting) => (
        <Card key={setting.provider} className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="text-primary h-4 w-4" />
                <CardTitle className="text-base">
                  {providerNames[setting.provider] || setting.provider}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {setting.isActive ? t('active') : t('inactive')}
                </span>
                <Switch
                  checked={setting.isActive}
                  onCheckedChange={(checked) => handleToggle(setting.provider, checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor={`key-${setting.provider}`}>{t('apiKey')}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`key-${setting.provider}`}
                    type="password"
                    placeholder={setting.exists ? setting.maskedKey : t('enterApiKey')}
                    value={newKeys[setting.provider] || ''}
                    onChange={(e) =>
                      setNewKeys((prev) => ({ ...prev, [setting.provider]: e.target.value }))
                    }
                    className="font-mono"
                  />
                  <Button
                    onClick={() => handleSave(setting.provider)}
                    disabled={
                      isSaving === setting.provider ||
                      (!newKeys[setting.provider] && setting.exists)
                    }
                    size="icon"
                  >
                    {isSaving === setting.provider ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {setting.exists && !newKeys[setting.provider] && (
                  <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('apiKeyStored')}
                  </p>
                )}
                {!setting.exists && !newKeys[setting.provider] && (
                  <p className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-3 w-3" />
                    {t('apiKeyMissing')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
