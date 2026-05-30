'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import type { Document } from '@repo/shared';
import { useDocuments, useDeleteDocument } from '@/lib/hooks/use-documents';
import { DocumentCard } from '@/components/documents/document-card';
import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsPage() {
  const { data: docs, isLoading, isError } = useDocuments();
  const del = useDeleteDocument();
  const [target, setTarget] = useState<Document | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">Knowledge base</div>
            <h1 className="font-serif text-3xl font-semibold">Documents</h1>
          </div>
          <Button asChild className="gap-2">
            <Link href="/documents/new"><Plus className="h-4 w-4" />New document</Link>
          </Button>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        )}

        {isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load your documents. Make sure the API is running and try again.
          </p>
        )}

        {docs && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-serif text-xl font-semibold">No documents yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first document to start building a knowledge base your AI can answer from.
            </p>
            <Button asChild className="mt-5 gap-2">
              <Link href="/documents/new"><Plus className="h-4 w-4" />Create document</Link>
            </Button>
          </div>
        )}

        {docs && docs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={setTarget} />
            ))}
          </div>
        )}
      </div>

      <DeleteDocumentDialog
        open={!!target}
        onOpenChange={(v) => !v && setTarget(null)}
        title={target?.title ?? ''}
        pending={del.isPending}
        onConfirm={() => {
          if (!target) return;
          del.mutate(target.id, { onSuccess: () => setTarget(null) });
        }}
      />
    </div>
  );
}
