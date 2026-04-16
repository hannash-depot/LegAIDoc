'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiteLogo } from '@/components/layout/site-logo';
import { Upload, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { LogoSettings } from '@/lib/settings/get-logo';

interface Props {
  initialSettings: LogoSettings;
}

export function LogoUploadForm({ initialSettings }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoHeight, setLogoHeight] = useState(initialSettings.logoHeight);
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Client-side validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(selected.type)) {
      toast.error(t('invalidFileType'));
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('logoHeight', String(logoHeight));

      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      toast.success(t('logoSaved'));
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/settings/logo', { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('logoReset'));
        setFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setLogoHeight(36);
        router.refresh();
      }
    } catch {
      toast.error(t('logoResetFailed'));
    } finally {
      setIsResetting(false);
    }
  };

  const displayUrl = previewUrl || initialSettings.logoUrl;
  const hasChanges = file !== null || logoHeight !== initialSettings.logoHeight;

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div>
        <Label>{t('logoPreview')}</Label>
        <div className="bg-background mt-2 flex h-16 items-center rounded-lg border px-4">
          <SiteLogo logoUrl={displayUrl} height={logoHeight} />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{t('logoPreviewHelp')}</p>
      </div>

      {/* Upload */}
      <div className="space-y-2">
        <Label>{t('uploadLogo')}</Label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".png,.jpg,.jpeg,.svg,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="me-2 h-4 w-4" />
            {t('chooseLogo')}
          </Button>
          {file && <span className="text-muted-foreground text-sm">{file.name}</span>}
        </div>
        <p className="text-muted-foreground text-xs">{t('logoFileTypes')}</p>
      </div>

      {/* Height */}
      <div className="max-w-xs space-y-1.5">
        <Label>{t('logoHeight')}</Label>
        <Input
          type="number"
          min={20}
          max={60}
          value={logoHeight}
          onChange={(e) => setLogoHeight(parseInt(e.target.value) || 36)}
        />
        <p className="text-muted-foreground text-xs">{t('logoHeightHelp')}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isUploading || !hasChanges}>
          {isUploading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t('saveLogo')}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isResetting}>
          {isResetting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          <RotateCcw className="me-2 h-4 w-4" />
          {t('resetToDefault')}
        </Button>
      </div>
    </div>
  );
}
