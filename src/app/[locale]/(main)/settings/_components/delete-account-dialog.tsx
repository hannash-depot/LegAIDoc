'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface DeleteFormValues {
  password: string;
  confirmation: string;
}

export function DeleteAccountDialog() {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);

  const form = useForm<DeleteFormValues>({
    defaultValues: { password: '', confirmation: '' },
  });

  const { register, handleSubmit, formState, setError, reset } = form;

  async function onSubmit(values: DeleteFormValues) {
    if (values.confirmation !== 'DELETE') {
      setError('confirmation', { message: t('typeDelete') });
      return;
    }

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: values.password,
          confirmation: 'DELETE',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error?.code === 'INVALID_PASSWORD') {
          setError('password', {
            message: t('errors.invalidCurrentPassword'),
          });
          return;
        }
        throw new Error(data.error?.message || t('errors.updateFailed'));
      }

      await signOut({ callbackUrl: '/login' });
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : t('errors.updateFailed'),
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">{t('deleteAccount')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t('deleteAccount')}</DialogTitle>
          <DialogDescription>{t('deleteConfirmation')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formState.errors.root && (
            <div className="text-destructive text-sm font-medium">
              {formState.errors.root.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-password">{t('enterPassword')}</Label>
            <Input
              id="delete-password"
              type="password"
              dir="ltr"
              {...register('password', { required: true })}
            />
            {formState.errors.password && (
              <p className="text-destructive text-sm">{formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">{t('typeDelete')}</Label>
            <Input
              id="delete-confirmation"
              dir="ltr"
              placeholder="DELETE"
              {...register('confirmation', { required: true })}
            />
            {formState.errors.confirmation && (
              <p className="text-destructive text-sm">{formState.errors.confirmation.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {formState.isSubmitting ? t('deleting') : t('deleteButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
