'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Document } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface DocumentFormValues {
  title: string;
  content: string;
  tags: string[];
}

export function DocumentForm({
  initial, submitLabel, onSubmit, pending,
}: {
  initial?: Document;
  submitLabel: string;
  onSubmit: (values: DocumentFormValues) => void;
  pending?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    onSubmit({ title: title.trim(), content, tags });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required maxLength={500} value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Onboarding runbook" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
        <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
          placeholder="process, internal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Write or paste the document text. It will be chunked and embedded for retrieval."
          className="min-h-[320px] font-mono text-[13px] leading-relaxed" />
        <p className="text-xs text-muted-foreground">
          Saving re-indexes this document for AI retrieval.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
