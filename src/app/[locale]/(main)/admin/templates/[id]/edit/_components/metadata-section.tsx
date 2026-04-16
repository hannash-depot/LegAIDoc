'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LocalizedInput } from './localized-input';
import type { CategoryOption } from './template-editor';

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

interface MetadataSectionProps {
  metadata: MetadataState;
  onChange: (metadata: MetadataState) => void;
  categories: CategoryOption[];
}

export function MetadataSection({ metadata, onChange, categories }: MetadataSectionProps) {
  const t = useTranslations('templateEditor');

  function update(patch: Partial<MetadataState>) {
    onChange({ ...metadata, ...patch });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('metadata')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Slug + Category + Active */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t('slug')}</Label>
            <Input
              value={metadata.slug}
              onChange={(e) => update({ slug: e.target.value })}
              placeholder="lease-agreement"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('category')}</Label>
            <Select
              value={metadata.categoryId}
              onValueChange={(val) => update({ categoryId: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameHe} / {c.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Label htmlFor="active-toggle">{t('active')}</Label>
              <Switch
                id="active-toggle"
                checked={metadata.isActive}
                onCheckedChange={(checked) => update({ isActive: checked })}
              />
            </div>
          </div>
        </div>

        {/* Name: Hebrew-first with collapsible others */}
        <LocalizedInput
          label={t('nameHe')}
          value={{
            he: metadata.nameHe,
            ar: metadata.nameAr,
            en: metadata.nameEn,
            ru: metadata.nameRu,
          }}
          onChange={(val) =>
            update({
              nameHe: val.he,
              nameAr: val.ar,
              nameEn: val.en,
              nameRu: val.ru,
            })
          }
        />

        {/* Description: Hebrew-first with collapsible others */}
        <LocalizedInput
          label={t('descHe')}
          value={{
            he: metadata.descHe,
            ar: metadata.descAr,
            en: metadata.descEn,
            ru: metadata.descRu,
          }}
          onChange={(val) =>
            update({
              descHe: val.he,
              descAr: val.ar,
              descEn: val.en,
              descRu: val.ru,
            })
          }
          multiline
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
