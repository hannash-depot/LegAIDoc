'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, CheckCircle2, ShieldCheck, PenTool, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { SignaturePad } from './signature-pad';

interface SignatureFlowProps {
  documentId: string;
  signatoryId: string;
  documentTitle: string;
  signatoryName: string;
  signatoryEmail: string;
  renderedBody: string;
  alreadySigned: boolean;
}

export function SignatureFlow({
  documentId,
  signatoryId,
  documentTitle,
  signatoryName,
  signatoryEmail,
  renderedBody,
  alreadySigned,
}: SignatureFlowProps) {
  const t = useTranslations('signatureFlow');
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(alreadySigned ? 3 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSignedData, setIsSignedData] = useState(alreadySigned);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/signatories/${signatoryId}/otp`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error?.message || t('errorSendOtp'));
        return;
      }
      toast.success(t('successOtpSent'));
      setStep(2);
    } catch {
      toast.error(t('errorSendOtp'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error(t('errorInvalidOtpLength'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/signatories/${signatoryId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error?.message || t('errorVerifyOtp'));
        return;
      }
      toast.success(t('successVerifyOtp'));
      setStep(3);
    } catch {
      toast.error(t('errorVerifyOtp'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignDocument = async () => {
    if (!termsAccepted) {
      toast.error(t('errorTerms'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/signatories/${signatoryId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted, signatureImage: signatureImage || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error?.message || t('errorSign'));
        return;
      }
      toast.success(t('successSign'));
      setIsSignedData(true);
      router.refresh();
    } catch {
      toast.error(t('errorSign'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSignedData) {
    return (
      <Card className="mx-auto max-w-2xl border-green-200 shadow-lg dark:border-green-900">
        <CardHeader className="space-y-4 pt-10 pb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 p-4 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold">{t('signedTitle')}</CardTitle>
          <CardDescription className="text-lg">{t('signedDesc')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <div
          className={`rounded-full p-2 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <Mail className="h-5 w-5" />
        </div>
        <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
          <div className={`bg-primary h-full transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div
          className={`rounded-full p-2 ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
          <div className={`bg-primary h-full transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
        </div>
        <div
          className={`rounded-full p-2 ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <PenTool className="h-5 w-5" />
        </div>
      </div>

      {step === 1 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">{t('step1Title')}</CardTitle>
            <CardDescription>{t('step1Desc', { title: documentTitle })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="font-medium">{signatoryName}</p>
                <p className="text-muted-foreground text-sm">{signatoryEmail}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSendOtp} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {t('sendOtpBtn')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">{t('step2Title')}</CardTitle>
            <CardDescription>{t('step2Desc', { email: signatoryEmail })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto max-w-sm space-y-2">
              <label className="text-sm font-medium">{t('otpLabel')}</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="py-6 text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
              {t('backBtn')}
            </Button>
            <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {t('verifyOtpBtn')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <PenTool className="h-5 w-5" />
                {t('step3Title')}
              </CardTitle>
              <CardDescription>{documentTitle}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[500px] border-b bg-white p-6 text-zinc-900 sm:p-12 dark:bg-zinc-950 dark:text-zinc-100">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedBody }}
                />
              </div>

              <div className="bg-muted/30 space-y-6 p-6">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {t('esigDisclaimer')}
                  </p>
                </div>
                <SignaturePad onChange={setSignatureImage} disabled={isLoading} />
                <div className="mb-4 flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="cursor-pointer text-sm leading-relaxed font-medium"
                  >
                    {t('termsText')}
                  </label>
                </div>
                <Button
                  onClick={handleSignDocument}
                  disabled={isLoading || !termsAccepted}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <PenTool className="mr-2 h-5 w-5" />
                  )}
                  {t('signBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
