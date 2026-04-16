'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PenTool, Plus, Trash2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Signatory {
  name: string;
  email: string;
  role: 'INITIATOR' | 'COUNTER_PARTY';
}

interface RequestSignaturesDialogProps {
  documentId: string;
}

export function RequestSignaturesDialog({ documentId }: RequestSignaturesDialogProps) {
  const t = useTranslations('signing');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatories, setSignatories] = useState<Signatory[]>([
    { name: '', email: '', role: 'COUNTER_PARTY' },
  ]);

  const addSignatory = () => {
    setSignatories((prev) => [...prev, { name: '', email: '', role: 'COUNTER_PARTY' }]);
  };

  const removeSignatory = (index: number) => {
    setSignatories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    setSignatories((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const isValid = signatories.every(
    (s) => s.name.trim().length >= 1 && s.email.includes('@') && s.role,
  );

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/sign/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message || t('initiateError'));
        return;
      }

      toast.success(t('initiateSuccess'));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t('initiateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="from-primary shadow-primary/25 bg-gradient-to-r to-blue-600 shadow-lg">
          <PenTool className="h-4 w-4" />
          {t('initiate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            {t('initiate')}
          </DialogTitle>
          <DialogDescription>{t('initiateDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {signatories.map((sig, i) => (
            <div key={i} className="border-border/50 bg-muted/30 space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">#{i + 1}</span>
                {signatories.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSignatory(i)}
                    className="text-destructive hover:text-destructive h-7"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('removeSignatory')}
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${i}`} className="text-xs">
                    {t('signatoryName')}
                  </Label>
                  <Input
                    id={`name-${i}`}
                    value={sig.name}
                    onChange={(e) => updateSignatory(i, 'name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${i}`} className="text-xs">
                    {t('signatoryEmail')}
                  </Label>
                  <Input
                    id={`email-${i}`}
                    type="email"
                    value={sig.email}
                    onChange={(e) => updateSignatory(i, 'email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('selectRole')}</Label>
                <Select
                  value={sig.role}
                  onValueChange={(v) => updateSignatory(i, 'role', v as Signatory['role'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIATOR">{t('roleInitiator')}</SelectItem>
                    <SelectItem value="COUNTER_PARTY">{t('roleCounterParty')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addSignatory} className="w-full">
            <Plus className="h-4 w-4" />
            {t('addSignatory')}
          </Button>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="from-primary bg-gradient-to-r to-blue-600"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('submitRequest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
