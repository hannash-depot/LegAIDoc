'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Loader2,
  AlertTriangle,
  Save,
  Bot,
  Check,
  KeyRound,
  Languages,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  nameEn: string;
  nameHe: string;
  nameAr: string;
  nameRu: string;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

interface ParseResult {
  originalText: string;
  piiMaskedCount: number;
  definition: Record<string, unknown> | null;
  confidence: number;
  errors: string[];
  errorKind?: string;
  rawResponse?: string;
  tokenUsage?: {
    parse?: TokenUsage;
    translate?: TokenUsage;
  };
}

interface ProviderKeyStatus {
  provider: string;
  exists: boolean;
  isActive: boolean;
  maskedKey: string;
}

interface MonoStep {
  key: string;
  title: string;
  fields: MonoField[];
}

interface MonoField {
  key: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  width?: string;
}

interface MonoTemplate {
  version: number;
  steps: MonoStep[];
  documentBody: string;
}

const STAGE_KEYS: Record<string, string> = {
  uploading: 'stage_uploading',
  extracting: 'stage_extracting',
  masking: 'stage_masking',
  calling_llm: 'stage_calling_llm',
  calling_llm_retry_2: 'stage_calling_llm_retry',
  calling_llm_retry_3: 'stage_calling_llm_retry',
  extracting_json: 'stage_extracting_json',
  cache_hit: 'stage_cache_hit',
};

const LANG_OPTIONS = [
  { value: 'he', label: 'Hebrew', native: 'עברית' },
  { value: 'ar', label: 'Arabic', native: 'العربية' },
  { value: 'en', label: 'English', native: 'English' },
  { value: 'ru', label: 'Russian', native: 'Русский' },
] as const;

/**
 * Build a fully localized TemplateDefinitionV1 from the monolingual template
 * and per-language translations. Missing languages fall back to the original text.
 */
function buildLocalizedTemplate(mono: MonoTemplate, translations: Record<string, MonoTemplate>) {
  function localize(originalValue: string, getter: (t: MonoTemplate) => string | undefined) {
    const result: Record<string, string> = {};
    for (const lang of ['he', 'ar', 'en', 'ru']) {
      const translated = translations[lang];
      if (translated) {
        result[lang] = getter(translated) || originalValue;
      } else {
        result[lang] = originalValue;
      }
    }
    return result;
  }

  return {
    version: 1 as const,
    steps: mono.steps.map((step, si) => ({
      key: step.key,
      title: localize(step.title, (t) => t.steps?.[si]?.title),
      fields: step.fields.map((field, fi) => ({
        key: field.key,
        type: field.type,
        required: field.required,
        width: field.width || 'full',
        label: localize(field.label, (t) => t.steps?.[si]?.fields?.[fi]?.label),
        ...(field.placeholder
          ? {
              placeholder: localize(
                field.placeholder,
                (t) => t.steps?.[si]?.fields?.[fi]?.placeholder,
              ),
            }
          : {}),
      })),
    })),
    documentBody: localize(mono.documentBody, (t) => t.documentBody),
  };
}

export function AiImportForm({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations('aiImport');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedJson, setEditedJson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameHe, setNameHe] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini'>('claude');
  const [apiKey, setApiKey] = useState('');
  const [saveKey, setSaveKey] = useState(true);
  const [keyStatuses, setKeyStatuses] = useState<ProviderKeyStatus[]>([]);

  // Translation state
  const [translations, setTranslations] = useState<Record<string, MonoTemplate>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateLang, setTranslateLang] = useState<string>('');
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateTokens, setTranslateTokens] = useState<Record<string, TokenUsage>>({});

  // Streaming-parse progress state
  const [parseStage, setParseStage] = useState<string | null>(null);
  const [parseStreamChars, setParseStreamChars] = useState(0);

  // Fetch saved key statuses on mount
  useEffect(() => {
    fetch('/api/admin/settings/llm')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setKeyStatuses(data.data);
      })
      .catch(() => {});
  }, []);

  const currentKeyStatus = keyStatuses.find((s) => s.provider === provider);
  const hasStoredKey = currentKeyStatus?.exists && currentKeyStatus?.isActive;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setTranslations({});
    setTranslateTokens({});
    setParseStage('uploading');
    setParseStreamChars(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);
      if (apiKey.trim()) {
        formData.append('apiKey', apiKey.trim());
      }

      const res = await fetch('/api/admin/ai-parse', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';

      // Early-failure path (auth, feature flag, validation) — JSON envelope.
      if (!contentType.includes('ndjson')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error?.message || 'Failed to parse document');
          return;
        }
        // Legacy fallback: old-shape success JSON.
        if (data?.data) {
          setResult(data.data);
          setEditedJson(JSON.stringify(data.data.definition, null, 2));
        }
        return;
      }

      // Streaming NDJSON success path.
      if (!res.body) {
        setError('Failed to parse document');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let terminalResult: ParseResult | null = null;
      let terminalError: string | null = null;
      let streamedChars = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx = buffer.indexOf('\n');
        while (newlineIdx !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          newlineIdx = buffer.indexOf('\n');
          if (!line) continue;

          let ev: { type: string; [k: string]: unknown };
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }

          if (ev.type === 'status' && typeof ev.stage === 'string') {
            setParseStage(ev.stage);
          } else if (ev.type === 'delta' && typeof ev.text === 'string') {
            streamedChars += ev.text.length;
            setParseStreamChars(streamedChars);
          } else if (ev.type === 'done') {
            terminalResult = (ev.data as ParseResult) ?? null;
          } else if (ev.type === 'error') {
            terminalError = (ev.message as string) || 'Failed to parse document';
          }
        }
      }

      if (terminalError) {
        setError(terminalError);
        return;
      }
      if (!terminalResult) {
        setError('Parse stream ended without result');
        return;
      }

      setResult(terminalResult);
      setEditedJson(JSON.stringify(terminalResult.definition, null, 2));

      // Save API key if checkbox is checked and key was entered
      if (saveKey && apiKey.trim()) {
        try {
          await fetch('/api/admin/settings/llm', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              apiKey: apiKey.trim(),
              isActive: true,
            }),
          });
          setKeyStatuses((prev) => {
            const updated = prev.filter((s) => s.provider !== provider);
            updated.push({
              provider,
              exists: true,
              isActive: true,
              maskedKey: apiKey.trim().substring(0, 4) + '...',
            });
            return updated;
          });
          setApiKey('');
        } catch {
          // Non-critical — key save failed but parse succeeded
        }
      }
    } catch {
      setError('An error occurred while parsing');
    } finally {
      setIsLoading(false);
      setParseStage(null);
    }
  };

  const handleTranslate = async () => {
    if (!translateLang || !result?.definition) return;

    setIsTranslating(true);
    setTranslateError(null);

    try {
      let currentTemplate;
      try {
        currentTemplate = JSON.parse(editedJson);
      } catch {
        setTranslateError('Invalid JSON in editor. Fix the JSON before translating.');
        return;
      }

      const res = await fetch('/api/admin/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: currentTemplate,
          targetLang: translateLang,
          provider,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTranslateError(data.error?.message || 'Translation failed');
        return;
      }

      if (data.data.translation) {
        setTranslations((prev) => ({ ...prev, [translateLang]: data.data.translation }));
      }

      if (data.data.tokenUsage?.translate) {
        setTranslateTokens((prev) => ({
          ...prev,
          [translateLang]: data.data.tokenUsage.translate,
        }));
      }
    } catch {
      setTranslateError('An error occurred during translation');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!result?.definition || !nameEn || !categoryId) return;

    setIsSaving(true);
    try {
      let monoTemplate: MonoTemplate;
      try {
        monoTemplate = JSON.parse(editedJson);
      } catch {
        setError('Invalid JSON in editor');
        return;
      }

      // Merge monolingual + per-language translations into localized format
      const definition = buildLocalizedTemplate(monoTemplate, translations);

      const slug = nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn,
          nameHe: nameHe || nameEn,
          nameAr: nameHe || nameEn,
          nameRu: nameEn,
          slug,
          categoryId,
          definition,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const templateId = data.data?.id;
        if (templateId) {
          router.push(`/admin/templates/${templateId}/edit` as string & {});
        } else {
          router.push('/admin/templates' as string & {});
        }
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to save template');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceColor = result
    ? result.confidence >= 70
      ? 'text-green-600'
      : result.confidence >= 40
        ? 'text-yellow-600'
        : 'text-red-600'
    : '';

  const parseTokens = result?.tokenUsage?.parse
    ? result.tokenUsage.parse.inputTokens + result.tokenUsage.parse.outputTokens
    : 0;

  const totalTranslateTokens = Object.values(translateTokens).reduce(
    (sum, t) => sum + t.inputTokens + t.outputTokens,
    0,
  );

  const totalTokens = parseTokens + totalTranslateTokens;

  const translatedLangs = Object.keys(translations);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-border text-muted-foreground hover:border-primary/50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors"
          >
            <Upload className="mb-4 h-10 w-10" />
            <p className="mb-2 text-lg font-medium">{t('dropzone')}</p>
            <p className="mb-4 text-sm">{t('supported')}</p>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
              <span>{t('browseFiles')}</span>
            </Button>
          </div>

          {/* AI Provider Configuration */}
          <div className="border-border mt-6 rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4" />
              {t('aiProvider')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('provider')}</Label>
                <Select
                  value={provider}
                  onValueChange={(v) => setProvider(v as 'openai' | 'claude' | 'gemini')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                    <SelectItem value="openai">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="gemini">Gemini 2.5 Flash (Google)</SelectItem>
                  </SelectContent>
                </Select>
                {hasStoredKey && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" />
                    {t('keySaved')}
                  </p>
                )}
                {currentKeyStatus && !hasStoredKey && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <KeyRound className="h-3 w-3" />
                    {t('noKeySaved')}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key">{t('apiKey')}</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                  placeholder={
                    hasStoredKey
                      ? t('usingStoredKey')
                      : provider === 'claude'
                        ? 'sk-ant-...'
                        : provider === 'openai'
                          ? 'sk-...'
                          : 'AI...'
                  }
                />
                <label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={saveKey}
                    onChange={(e) => setSaveKey(e.target.checked)}
                    className="rounded"
                  />
                  {t('saveApiKey')}
                </label>
              </div>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">{t('apiKeyHelp')}</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                <div>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </div>
                {isLoading && parseStage && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {STAGE_KEYS[parseStage]
                      ? t(STAGE_KEYS[parseStage] as 'stage_extracting')
                      : parseStage}
                    {parseStreamChars > 0 && ` · ${parseStreamChars.toLocaleString()} chars`}
                  </div>
                )}
              </div>
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('parsingStructure')}
                  </>
                ) : (
                  t('parseButton')
                )}
              </Button>
            </div>
          )}

          {error && (
            <div
              className="bg-destructive/10 text-destructive mt-4 rounded-lg p-3 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results — AISP-08: Side-by-side verification */}
      {result && (
        <>
          {/* Confidence & Stats */}
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">{t('confidence')}</p>
                <p className={`text-3xl font-bold ${confidenceColor}`}>{result.confidence}%</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">{t('piiMasked')}</p>
                <p className="text-3xl font-bold">{result.piiMaskedCount}</p>
              </CardContent>
            </Card>
            {totalTokens > 0 && (
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">{t('tokensUsed')}</p>
                  <p className="text-3xl font-bold">{totalTokens.toLocaleString()}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('parsePhase')}: {parseTokens.toLocaleString()}
                    {totalTranslateTokens > 0 && (
                      <>
                        {' / '}
                        {t('translatePhase')}: {totalTranslateTokens.toLocaleString()}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  {t('validationWarnings')} ({result.errors.length})
                  {result.errorKind && (
                    <span className="text-xs font-normal">({result.errorKind})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                {result.rawResponse && (
                  <details className="mt-3">
                    <summary className="text-muted-foreground cursor-pointer text-xs">
                      {t('showRawResponse')}
                    </summary>
                    <pre className="bg-secondary/50 mt-2 max-h-48 overflow-auto rounded p-3 text-xs whitespace-pre-wrap">
                      {result.rawResponse}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* Side-by-side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Original text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('originalText')}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary/50 max-h-96 overflow-auto rounded p-4 text-xs whitespace-pre-wrap">
                  {result.originalText}
                </pre>
              </CardContent>
            </Card>

            {/* AISP-09: Editable JSON */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('generatedSchema')}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={editedJson}
                  onChange={(e) => setEditedJson(e.target.value)}
                  className="bg-secondary/50 focus:ring-ring h-96 w-full rounded p-4 font-mono text-xs focus:ring-2 focus:outline-none"
                  spellCheck={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Translation Section */}
          {result.definition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Languages className="h-4 w-4" />
                  {t('translationSection')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Language status badges */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {LANG_OPTIONS.map(({ value, label, native }) => (
                    <span
                      key={value}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        translatedLangs.includes(value)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {translatedLangs.includes(value) && <Check className="h-3 w-3" />}
                      {label} ({native})
                    </span>
                  ))}
                </div>

                {/* Language picker + Translate button */}
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('targetLanguage')}</Label>
                    <Select value={translateLang} onValueChange={setTranslateLang}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LANG_OPTIONS.map(({ value, label, native }) => (
                          <SelectItem key={value} value={value}>
                            {label} ({native})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleTranslate} disabled={isTranslating || !translateLang}>
                    {isTranslating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Languages className="h-4 w-4" />
                    )}
                    {isTranslating ? t('translating') : t('translateButton')}
                  </Button>
                </div>

                {translateError && (
                  <div
                    className="bg-destructive/10 text-destructive mt-3 rounded-lg p-3 text-sm"
                    role="alert"
                  >
                    {translateError}
                  </div>
                )}

                {translatedLangs.length > 0 && translatedLangs.length < 4 && (
                  <p className="text-muted-foreground mt-3 text-xs">{t('partialWarning')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save as Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('saveAsTemplate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{t('nameEn')}</Label>
                  <Input
                    value={nameEn}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameEn(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('nameHe')}</Label>
                  <Input
                    value={nameHe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameHe(e.target.value)}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('category')}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameEn} / {c.nameHe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={isSaving || !nameEn || !categoryId}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t('saveButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
