'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useDocument, useDeleteDocument } from '@/lib/hooks/use-documents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { formatDate } from '@/lib/utils';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: doc, isLoading, isError } = useDocument(id);
  const del = useDeleteDocument();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
          <Link href="/documents"><ArrowLeft className="h-4 w-4" />All documents</Link>
        </Button>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-72 w-full" />
          </div>
        )}

        {isError && <p className="text-sm text-destructive">Document not found.</p>}

        {doc && (
          <article>
            <header className="mb-6 border-b border-border pb-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-3xl font-semibold leading-tight">{doc.title}</h1>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={`/documents/${doc.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setConfirm(true)}>
                    <Trash2 className="h-4 w-4" />Delete
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {doc.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  Updated {formatDate(doc.updatedAt)}
                </span>
              </div>
            </header>
            <div className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed text-foreground/90">
              {doc.content || <span className="text-muted-foreground">This document is empty.</span>}
            </div>
          </article>
        )}
      </div>

      <DeleteDocumentDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={doc?.title ?? ''}
        pending={del.isPending}
        onConfirm={() => doc && del.mutate(doc.id, { onSuccess: () => router.replace('/documents') })}
      />
    </div>
  );
}
