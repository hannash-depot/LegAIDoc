'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type TemplateListItem = {
  id: string;
  slug: string;
  nameEn: string;
  nameHe: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  category: {
    id: string;
    nameEn: string;
    nameHe: string;
  };
  _count: {
    documents: number;
  };
};

export function TemplateList({ initialTemplates }: { initialTemplates: TemplateListItem[] }) {
  const router = useRouter();
  const t = useTranslations('adminTemplates');
  const [templates, setTemplates] = useState<TemplateListItem[]>(initialTemplates);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(tpl: TemplateListItem) {
    setTogglingId(tpl.id);
    const previousTemplates = [...templates];

    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((item) => (item.id === tpl.id ? { ...item, isActive: !item.isActive } : item)),
    );

    try {
      const res = await fetch(`/api/admin/templates/${tpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tpl.isActive }),
      });
      if (res.ok) {
        toast.success(!tpl.isActive ? t('activated') : t('deactivated'));
        router.refresh();
      } else {
        setTemplates(previousTemplates);
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error?.message || t('toggleFailed'));
      }
    } catch {
      setTemplates(previousTemplates);
      toast.error(t('toggleError'));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/templates/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('slug')}</TableHead>
              <TableHead>{t('nameEnHe')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('version')}</TableHead>
              <TableHead>{t('uses')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('created')}</TableHead>
              <TableHead className="text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {t('noTemplates')}
                </TableCell>
              </TableRow>
            ) : (
              templates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.slug}</TableCell>
                  <TableCell>
                    {tpl.nameEn} <span className="text-muted-foreground mx-1">/</span> {tpl.nameHe}
                  </TableCell>
                  <TableCell>{tpl.category.nameEn}</TableCell>
                  <TableCell>v{tpl.version}</TableCell>
                  <TableCell>{tpl._count.documents}</TableCell>
                  <TableCell>
                    <Badge variant={tpl.isActive ? 'default' : 'secondary'}>
                      {tpl.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(tpl.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/templates/${tpl.id}/edit` as string & {}}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Switch
                        checked={tpl.isActive}
                        disabled={togglingId === tpl.id}
                        onCheckedChange={() => handleToggle(tpl)}
                        aria-label={`Toggle ${tpl.nameEn} active status`}
                      />
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(tpl)}>
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm', { name: deleteTarget?.nameEn ?? '' })}
              {deleteTarget && deleteTarget._count.documents > 0 && (
                <> {t('deleteHasDocuments', { count: deleteTarget._count.documents })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
