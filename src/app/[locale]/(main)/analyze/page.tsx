'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyzePage() {
  const t = useTranslations('Analyze');
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!disclaimerAccepted) {
      toast.error(t('disclaimer_required'));
      return;
    }
    if (!file.type.includes('pdf') && !file.type.includes('wordprocessingml')) {
      toast.error(t('unsupported_file'));
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error?.message || 'Upload failed');

      toast.success(t('upload_success'));
      // Keep on current locale route by just pushing the relative path
      router.push(`analyze/${data.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('upload_failed'));
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('title') || 'Contract Review & Risk Analysis'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('description') ||
            'Upload a third-party contract to instantly identify legal risks, missing clauses, and get an executive summary.'}
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">{t('ai_disclaimer')}</p>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="rounded border-amber-400"
              />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('ai_disclaimer_accept')}
              </span>
            </label>
          </div>
        </div>
      </div>

      <Card className={!disclaimerAccepted ? 'pointer-events-none opacity-60' : ''}>
        <CardHeader>
          <CardTitle>{t('upload_title') || 'Upload Document'}</CardTitle>
          <CardDescription>
            {t('upload_desc') || 'Supports PDF and DOCX files up to 50MB.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleChange}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="text-primary flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="font-medium">
                  {t('uploading') || 'Extracting text and uploading...'}
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-4">
                <div className="bg-muted rounded-full p-4">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {t('drag_drop') || 'Drag and drop your file here'}
                  </p>
                  <p className="text-sm">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="text-muted-foreground flex items-start gap-3 text-sm">
              <AlertCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {t('privacy_notice') ||
                  'Your documents are processed securely and deleted from our active cache after analysis. Data is not used to train global AI models.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
