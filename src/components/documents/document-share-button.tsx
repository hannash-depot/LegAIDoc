'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Share2, Check, Loader2, Link } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DocumentShareButtonProps {
  documentId: string;
  status: string;
}

export function DocumentShareButton({ documentId, status }: DocumentShareButtonProps) {
  const t = useTranslations('documents');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [permission, setPermission] = useState<'VIEW' | 'COMMENT'>('VIEW');

  if (status === 'ARCHIVED') return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });
      if (res.ok) {
        const { data } = await res.json();
        const shareUrl = `${window.location.origin}/${locale}/shared/${data.token}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          {t('share')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle>Share Settings</DialogTitle>
          <DialogDescription>Generate a link to share this document.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <RadioGroup
            value={permission}
            onValueChange={(val: 'VIEW' | 'COMMENT') => setPermission(val)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="VIEW" id="r1" />
              <Label htmlFor="r1">View Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="COMMENT" id="r2" />
              <Label htmlFor="r2">Comment Only (Counterparty)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : shareSuccess ? (
              <Check className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <Link className="mr-2 h-4 w-4" />
            )}
            {shareSuccess ? t('shareCopied') : 'Copy Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
