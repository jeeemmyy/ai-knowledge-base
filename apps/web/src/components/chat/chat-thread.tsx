'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import type { Message } from '@repo/shared';
import { useMessages, useSendMessage } from '@/lib/hooks/use-chat';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';

const SUGGESTIONS = [
  'Summarize my documents',
  'What are the key points across everything I’ve saved?',
  'What did I write about onboarding?',
];

export function ChatThread({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const { data: messages, isLoading } = useMessages(conversationId);
  const send = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, send.isPending]);

  function handleSend(text: string) {
    send.mutate(
      { conversationId: conversationId ?? undefined, message: text },
      {
        onSuccess: (result) => {
          // First message in a brand-new chat → move to its permalink.
          if (!conversationId) router.replace(`/chat/${result.conversationId}`);
        },
      },
    );
  }

  const isEmpty = !conversationId || (messages && messages.length === 0);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {isLoading && conversationId && (
            <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>
          )}

          {isEmpty && !send.isPending && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="font-serif text-3xl font-semibold">Ask your knowledge base</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Questions are answered using only the documents you’ve saved, with citations
                back to the source.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages?.map((m: Message) => <MessageBubble key={m.id} message={m} />)}
            {send.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={send.isPending} />
    </div>
  );
}
