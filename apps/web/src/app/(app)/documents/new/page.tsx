'use client';
import { useRouter } from 'next/navigation';
import { useCreateDocument } from '@/lib/hooks/use-documents';
import { DocumentForm } from '@/components/documents/document-form';

export default function NewDocumentPage() {
  const router = useRouter();
  const create = useCreateDocument();
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">New</div>
          <h1 className="font-serif text-3xl font-semibold">Create document</h1>
        </div>
        <DocumentForm
          submitLabel="Create document"
          pending={create.isPending}
          onSubmit={(values) =>
            create.mutate(values, { onSuccess: (doc) => router.replace(`/documents/${doc.id}`) })
          }
        />
      </div>
    </div>
  );
}
