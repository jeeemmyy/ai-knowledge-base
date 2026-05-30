'use client';
import Link from 'next/link';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import type { Document } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (doc: Document) => void }) {
  const preview = doc.content.trim().slice(0, 160);
  return (
    <Card className="group flex flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-primary">
            <FileText className="h-4 w-4 shrink-0" />
            <h3 className="truncate font-serif text-lg font-semibold text-foreground">{doc.title}</h3>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preview || 'Empty document'}
            {doc.content.length > 160 ? '…' : ''}
          </p>
        </Link>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/documents/${doc.id}/edit`} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(doc)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {doc.tags.slice(0, 4).map((t) => (
          <Badge key={t} variant="muted">{t}</Badge>
        ))}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {formatDate(doc.updatedAt)}
        </span>
      </div>
    </Card>
  );
}
