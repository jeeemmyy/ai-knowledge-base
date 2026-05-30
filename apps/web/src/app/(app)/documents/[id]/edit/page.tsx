'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDocument, useUpdateDocument } from '@/lib/hooks/use-documents';
import { DocumentForm } from '@/components/documents/document-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: doc, isLoading } = useDocument(id);
  const update = useUpdateDocument(id);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">Edit</div>
          <h1 className="font-serif text-3xl font-semibold">Edit document</h1>
        </div>
        {isLoading && <Skeleton className="h-96 w-full" />}
        {doc && (
          <DocumentForm
            initial={doc}
            submitLabel="Save changes"
            pending={update.isPending}
            onSubmit={(values) =>
              update.mutate(values, { onSuccess: () => router.replace(`/documents/${id}`) })
            }
          />
        )}
      </div>
    </div>
  );
}
