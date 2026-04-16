'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentStatusFilter, type StatusFilter } from './document-status-filter';
import { DocumentCard } from './document-card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { FileText, Plus, Search, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  template: {
    nameHe: string;
    nameAr: string;
    nameEn: string;
    nameRu: string;
  };
}

interface DocumentListProps {
  documents: DocumentData[];
}

type SortOption = 'newest' | 'oldest' | 'title';
type ViewMode = 'list' | 'grid';

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export function DocumentList({ documents: initialDocs }: DocumentListProps) {
  const t = useTranslations('documents');
  const [documents, setDocuments] = useState(initialDocs);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const doc of documents) {
      c[doc.status] = (c[doc.status] || 0) + 1;
    }
    return c;
  }, [documents]);

  const filteredAndSorted = useMemo(() => {
    let result = documents;

    // Filter by status
    if (activeFilter !== 'ALL') {
      result = result.filter((d) => d.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(query));
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [documents, activeFilter, searchQuery, sortBy]);

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">{t('title')}</h1>
        <Link href="/templates">
          <Button
            variant="default"
            className="shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('createFirst')}
          </Button>
        </Link>
      </div>

      <div className="glass flex flex-col gap-4 rounded-2xl border-white/20 p-4 md:flex-row md:items-center md:justify-between dark:border-white/5">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus-glow glass border-white/20 pl-9 dark:border-white/10"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm whitespace-nowrap">{t('sortBy')}:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="focus-glow glass w-[160px] border-white/20 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-popover">
                <SelectItem value="newest">{t('sortNewest')}</SelectItem>
                <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
                <SelectItem value="title">{t('sortTitle')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 border-border/50 hidden items-center rounded-lg border p-1 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <DocumentStatusFilter active={activeFilter} onChange={setActiveFilter} counts={counts} />
      )}

      {filteredAndSorted.length === 0 ? (
        <PremiumEmptyState
          icon={<FileText className="h-8 w-8" />}
          title={documents.length === 0 ? t('empty') : t('noFilterResults')}
          description={
            documents.length === 0
              ? "You haven't created any documents yet. Get started by exploring our templates."
              : "Try adjusting your search criteria or clear your filters to find what you're looking for."
          }
          action={
            documents.length === 0 ? (
              <Link href="/templates" className="mt-4 inline-block">
                <Button
                  variant="default"
                  className="shadow-primary/20 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  {t('createFirst')}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((doc) => (
              <motion.div key={doc.id} layout variants={listItemVariants} exit="exit">
                <DocumentCard document={doc} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
