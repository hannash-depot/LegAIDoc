'use client';

import { useState, useRef, useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, MessageCircle, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  quote?: string | null;
  createdAt: string;
  resolved: boolean;
}

export function SharedDocumentViewer({
  token,
  renderedBody,
  locale,
  permission,
}: {
  token: string;
  renderedBody: string;
  locale: string;
  permission: 'VIEW' | 'COMMENT';
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/shared/${token}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.data || []);
      }
    } catch (fetchErr) {
      clientLogger.error('Failed to fetch comments', fetchErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseUp = () => {
    if (permission !== 'COMMENT') return;

    // Timeout to allow selection to complete naturally
    setTimeout(() => {
      const selection = window.getSelection();
      if (
        selection &&
        selection.toString().trim().length > 0 &&
        containerRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          setSelectionRect({
            top: rect.top - containerRect.top - 40,
            left: rect.left - containerRect.left + rect.width / 2 - 60,
          });
          setSelectedText(selection.toString().trim());
        }
      } else if (!showCommentForm) {
        setSelectionRect(null);
        setSelectedText('');
      }
    }, 10);
  };

  const handleStartComment = () => {
    setShowCommentForm(true);
    setSelectionRect(null);
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setSelectedText('');
    setContent('');
  };

  const handleSubmitComment = async () => {
    if (!authorName.trim() || !content.trim()) {
      toast.error('Name and comment are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/shared/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          content,
          quote: selectedText,
        }),
      });

      if (res.ok) {
        toast.success('Comment added successfully');
        handleCancelComment();
        fetchComments();
      } else {
        toast.error('Failed to add comment');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Document Area */}
      <div className="relative lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base">Document Content</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div ref={containerRef} onMouseUp={handleMouseUp} className="relative">
              <div
                className="prose dark:prose-invert max-w-none break-words"
                dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: renderedBody }}
              />

              {/* Floating Add Comment Button */}
              {selectionRect && !showCommentForm && (
                <div
                  className="absolute z-10"
                  style={{ top: selectionRect.top, left: selectionRect.left }}
                >
                  <Button
                    size="sm"
                    onClick={handleStartComment}
                    className="flex items-center gap-1 shadow-lg"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    Comment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Data Area */}
      <div className="space-y-4">
        {showCommentForm && (
          <Card className="border-primary shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">New Comment</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCancelComment}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {selectedText && (
                <div className="bg-muted border-primary truncate rounded-md border-l-2 p-2 text-xs italic">
                  &ldquo;{selectedText}&rdquo;
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium">Your Name</label>
                <Input
                  size={1}
                  className="h-8 text-sm"
                  placeholder="Enter your name..."
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Comment</label>
                <Textarea
                  className="min-h-[80px] text-sm"
                  placeholder="Type your comment..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !authorName.trim() || !content.trim()}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="text-muted-foreground h-4 w-4" />
              <CardTitle className="text-foreground text-base">
                Comments ({comments.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">No comments yet.</div>
            ) : (
              <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-card text-card-foreground rounded-lg border p-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="text-sm font-semibold">{comment.authorName}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {comment.quote && (
                      <div className="bg-muted/50 border-muted-foreground mb-2 truncate rounded border-l-2 p-2 text-xs italic">
                        &ldquo;{comment.quote}&rdquo;
                      </div>
                    )}
                    <div className="text-sm">{comment.content}</div>
                    {comment.resolved && (
                      <div className="mt-2 flex items-center text-xs font-medium text-green-600">
                        <Check className="mr-1 h-3 w-3" /> Resolved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
