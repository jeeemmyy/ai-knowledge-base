'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Quote } from 'lucide-react';
import type { MessageSource } from '@repo/shared';
import { cn } from '@/lib/utils';

export function SourceCitations({ sources }: { sources: MessageSource[] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  // De-duplicate by document so we show one entry per cited document.
  const byDoc = new Map<string, MessageSource>();
  for (const s of sources) if (!byDoc.has(s.documentId)) byDoc.set(s.documentId, s);
  const unique = [...byDoc.values()];

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <Quote className="h-3.5 w-3.5" />
        {unique.length} source{unique.length > 1 ? 's' : ''}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {unique.map((s) => (
            <li key={s.chunkId} className="rounded-lg border border-border bg-background/60 p-3 text-sm">
              <Link href={`/documents/${s.documentId}`}
                className="font-medium text-primary underline-offset-2 hover:underline">
                {s.documentTitle}
              </Link>
              <p className="mt-1 line-clamp-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                {s.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
