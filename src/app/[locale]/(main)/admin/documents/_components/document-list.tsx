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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DOCUMENT_STATUSES = [
  'DRAFT',
  'PENDING_SIGNATURE',
  'PUBLISHED',
  'SIGNED',
  'ARCHIVED',
] as const;

type CategoryOption = {
  id: string;
  nameEn: string;
  nameHe: string;
};

type DocumentListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  template: {
    id: string;
    nameEn: string;
    slug: string;
    isActive: boolean;
    category: CategoryOption | null;
  };
  _count: {
    signatories: number;
  };
};

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'SIGNED':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'ARCHIVED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function DocumentList({
  initialDocuments,
  categories,
}: {
  initialDocuments: DocumentListItem[];
  categories: CategoryOption[];
}) {
  const t = useTranslations('adminDocuments');
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentListItem[]>(initialDocuments);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && doc.template.category?.id !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = doc.title.toLowerCase().includes(q);
      const matchesEmail = doc.user.email.toLowerCase().includes(q);
      const matchesName = doc.user.name.toLowerCase().includes(q);
      if (!matchesTitle && !matchesEmail && !matchesName) return false;
    }
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/documents/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.deleted) {
          setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
          toast.success(t('deleted'));
        } else {
          setDocuments((prev) =>
            prev.map((d) => (d.id === deleteTarget.id ? { ...d, status: 'ARCHIVED' } : d)),
          );
          toast.success(t('archived'));
        }
        setDeleteTarget(null);
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error?.message || t('deleteFailed'));
      }
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            {DOCUMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colTitle')}</TableHead>
              <TableHead>{t('colTemplate')}</TableHead>
              <TableHead>{t('colCategory')}</TableHead>
              <TableHead>{t('colOwner')}</TableHead>
              <TableHead>{t('colSignatories')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead>{t('colCreated')}</TableHead>
              <TableHead className="text-end">{t('colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {t('noDocuments')}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {doc.template.nameEn}
                      {!doc.template.isActive && (
                        <Badge variant="destructive" className="px-1 py-0 text-[10px]">
                          {t('inactive')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{doc.template.category?.nameEn || '\u2014'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{doc.user.name}</span>
                      <span className="text-muted-foreground text-xs">{doc.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc._count.signatories}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/documents/${doc.id}/edit` as string & {}}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(doc)}>
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm', { title: deleteTarget?.title || '' })}
              {deleteTarget && deleteTarget.status !== 'DRAFT' && (
                <span className="text-muted-foreground mt-2 block">{t('deleteArchiveNote')}</span>
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
