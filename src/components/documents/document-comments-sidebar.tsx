'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { clientLogger } from '@/lib/client-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  quote?: string | null;
  createdAt: string;
  resolved: boolean;
}

export function DocumentCommentsSidebar({ documentId }: { documentId: string }) {
  const t = useTranslations('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [hideResolved, setHideResolved] = useState(false);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.data || []);
      }
    } catch (err) {
      clientLogger.error('Failed to fetch comments', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (commentId: string, currentResolved: boolean) => {
    setResolvingId(commentId);
    try {
      const res = await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !currentResolved }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, resolved: !currentResolved } : c)),
        );
        toast.success(currentResolved ? t('unresolve') : t('resolve'));
      } else {
        toast.error(t('errorUpdate'));
      }
    } catch {
      toast.error(t('errorGeneric'));
    } finally {
      setResolvingId(null);
    }
  };

  const filteredComments = useMemo(() => {
    if (hideResolved) {
      return comments.filter((c) => !c.resolved);
    }
    return comments;
  }, [comments, hideResolved]);

  return (
    <Card className="flex h-full flex-col border-none shadow-none">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-muted-foreground h-4 w-4" />
            <CardTitle className="text-foreground text-sm font-semibold">
              {t('title')} {comments.length > 0 && `(${comments.length})`}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="hide-resolved"
              checked={hideResolved}
              onCheckedChange={setHideResolved}
              className="scale-75"
            />
            <Label htmlFor="hide-resolved" className="text-muted-foreground cursor-pointer text-xs">
              {t('hideResolved')}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            {comments.length === 0 ? t('noComments') : t('hideResolved')}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg border p-3 text-sm ${comment.resolved ? 'bg-muted/30 opacity-70' : 'bg-card shadow-sm'}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="font-semibold">{comment.authorName}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {comment.quote && (
                  <div className="bg-muted/50 border-primary mb-2 truncate rounded border-l-2 p-2 text-xs italic">
                    &ldquo;{comment.quote}&rdquo;
                  </div>
                )}
                <div className="text-muted-foreground mb-3 whitespace-pre-wrap">
                  {comment.content}
                </div>

                <div className="mt-2 flex justify-end border-t pt-2">
                  <Button
                    variant={comment.resolved ? 'outline' : 'secondary'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleResolve(comment.id, comment.resolved)}
                    disabled={resolvingId === comment.id}
                  >
                    {resolvingId === comment.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : comment.resolved ? null : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {comment.resolved ? t('unresolve') : t('resolve')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
