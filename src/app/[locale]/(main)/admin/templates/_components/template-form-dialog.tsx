'use client';

import { useState } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { TemplateCreateSchema, type TemplateCreateInput } from '@/schemas/template';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

type CategoryOption = { id: string; nameEn: string; nameHe: string };

export function TemplateFormDialog({
  categories,
  trigger,
}: {
  categories: CategoryOption[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('adminTemplates');
  const tCommon = useTranslations('common');

  const form = useForm<
    z.input<typeof TemplateCreateSchema>,
    unknown,
    z.output<typeof TemplateCreateSchema>
  >({
    resolver: zodResolver(TemplateCreateSchema),
    defaultValues: {
      slug: '',
      nameEn: '',
      nameHe: '',
      nameAr: '',
      nameRu: '',
      descEn: '',
      descHe: '',
      descAr: '',
      descRu: '',
      categoryId: categories[0]?.id || '',
      isActive: true,
      // Basic empty definition to start. Full builder usually needed for complex trees.
      definition: {
        version: 1,
        steps: [
          {
            key: 'step1',
            title: { he: '', ar: '', en: 'Step 1', ru: '' },
            fields: [],
          },
        ],
        documentBody: { he: '', ar: '', en: '', ru: '' },
      },
    },
  });

  async function onSubmit(values: TemplateCreateInput) {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create template');
      }

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      clientLogger.error('Failed to create template', error);
      form.setError('root', { message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>{t('createDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="text-destructive text-sm font-medium">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('slug')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('slugPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <FormControl>
                      {/* Ideally an accessible Select component but using native select for simplicity here */}
                      <select
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEn} / {c.nameHe}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('englishName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameHe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hebrewName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('arabicName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('russianName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('englishDescription')}</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('active')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('createButton')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
