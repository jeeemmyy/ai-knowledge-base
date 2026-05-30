'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { useConversations, useDeleteConversation } from '@/lib/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ConversationSidebar({ activeId }: { activeId: string | null }) {
  const { data: conversations, isLoading } = useConversations();
  const del = useDeleteConversation();
  const router = useRouter();

  return (
    <div className="hidden w-72 shrink-0 flex-col border-r border-border bg-background/40 lg:flex">
      <div className="p-3">
        <Button asChild variant="outline" className="w-full justify-start gap-2">
          <Link href="/chat"><MessageSquarePlus className="h-4 w-4" />New chat</Link>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && (
          <div className="space-y-2 px-1">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        )}
        {conversations && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations yet.
          </p>
        )}
        <ul className="space-y-1">
          {conversations?.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id} className="group relative">
                <Link
                  href={`/chat/${c.id}`}
                  className={cn(
                    'block truncate rounded-lg px-3 py-2 pr-8 text-sm transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-secondary',
                  )}
                >
                  {c.title}
                </Link>
                <button
                  aria-label="Delete conversation"
                  onClick={() =>
                    del.mutate(c.id, {
                      onSuccess: () => { if (active) router.replace('/chat'); },
                    })
                  }
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
