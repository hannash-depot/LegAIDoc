'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Languages, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { TemplateDefinitionType } from '@/schemas/template-definition';

type LlmProvider = 'openai' | 'claude' | 'gemini';

interface ProviderInfo {
  provider: string;
  exists: boolean;
  isActive: boolean;
}

interface LangResult {
  lang: string;
  status: 'success' | 'error';
  error?: string;
}

interface SyncResult {
  metadata: Record<string, string>;
  definition: TemplateDefinitionType;
  languages: LangResult[];
  stringCount: number;
}

interface MetadataState {
  slug: string;
  nameHe: string;
  nameAr: string;
  nameEn: string;
  nameRu: string;
  descHe: string;
  descAr: string;
  descEn: string;
  descRu: string;
  categoryId: string;
  isActive: boolean;
}

interface AiSyncButtonProps {
  metadata: MetadataState;
  definition: TemplateDefinitionType;
  onSync: (metadata: Partial<MetadataState>, definition: TemplateDefinitionType) => void;
}

export function AiSyncButton({ metadata, definition, onSync }: AiSyncButtonProps) {
  const t = useTranslations('templateEditor');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState<LlmProvider>('claude');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<LangResult[] | null>(null);

  // Fetch available providers
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/llm');
      if (res.ok) {
        const data = await res.json();
        const list: ProviderInfo[] = data.data || [];
        setProviders(list);
        const active = list.find((p: ProviderInfo) => p.isActive);
        if (active) setProvider(active.provider as LlmProvider);
      }
    } catch {
      // Silently fail — user can still type provider
    }
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      fetchProviders();
      setResults(null);
    }
  }, [dialogOpen, fetchProviders]);

  async function handleSync() {
    setSyncing(true);
    setResults(null);

    try {
      const res = await fetch('/api/admin/ai-sync-languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            nameHe: metadata.nameHe,
            descHe: metadata.descHe,
          },
          definition,
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults([{ lang: 'all', status: 'error', error: data.error?.message || 'Failed' }]);
        return;
      }

      const result: SyncResult = data.data;
      setResults(result.languages);

      // Merge translated data back
      const metaPatch: Partial<MetadataState> = {};
      if (result.metadata) {
        if (result.metadata.nameAr) metaPatch.nameAr = result.metadata.nameAr;
        if (result.metadata.nameEn) metaPatch.nameEn = result.metadata.nameEn;
        if (result.metadata.nameRu) metaPatch.nameRu = result.metadata.nameRu;
        if (result.metadata.descAr) metaPatch.descAr = result.metadata.descAr;
        if (result.metadata.descEn) metaPatch.descEn = result.metadata.descEn;
        if (result.metadata.descRu) metaPatch.descRu = result.metadata.descRu;
      }

      onSync(metaPatch, result.definition);
    } catch (err) {
      setResults([
        {
          lang: 'all',
          status: 'error',
          error: err instanceof Error ? err.message : 'Network error',
        },
      ]);
    } finally {
      setSyncing(false);
    }
  }

  const hasResults = results && results.length > 0;
  const allSuccess = hasResults && results.every((r) => r.status === 'success');

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
        <Languages className="h-4 w-4" />
        {t('syncLanguages')}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('syncLanguages')}
            </DialogTitle>
            <DialogDescription>{t('syncLanguagesDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Provider selection */}
            <div className="space-y-1.5">
              <Label>{t('selectProvider')}</Label>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as LlmProvider)}
                disabled={syncing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['claude', 'openai', 'gemini'] as const).map((p) => {
                    const info = providers.find((pi) => pi.provider === p);
                    return (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                        {info?.isActive && (
                          <span className="ms-2 text-xs text-green-600">(active)</span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            {!hasResults && !syncing && (
              <p className="text-muted-foreground text-sm">{t('syncLanguagesConfirm')}</p>
            )}

            {/* Progress / Results */}
            {syncing && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('syncing')}
              </div>
            )}

            {hasResults && (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.lang} className="flex items-center gap-2">
                    {r.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={r.status === 'success' ? 'default' : 'destructive'}>
                      {r.lang.toUpperCase()}
                    </Badge>
                    {r.error && <span className="text-destructive text-xs">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            {allSuccess ? (
              <Button onClick={() => setDialogOpen(false)}>{t('done')}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={syncing}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Languages className="h-4 w-4" />
                  )}
                  {syncing ? t('syncing') : t('syncLanguages')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
