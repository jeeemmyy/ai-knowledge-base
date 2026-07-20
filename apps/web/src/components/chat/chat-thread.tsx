'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from '@repo/shared';
import { useMessages } from '@/lib/hooks/use-chat';
import { chatApi } from '@/lib/api/chat';
import { apiErrorMessage } from '@/lib/api/client';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';

const SUGGESTIONS = [
  'Summarize my documents',
  'What are the key points across everything I’ve saved?',
  'What did I write about onboarding?',
];

interface StreamState {
  userText: string;
  assistantText: string;
}

export function ChatThread({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: messages, isLoading } = useMessages(conversationId);
  const [stream, setStream] = useState<StreamState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, stream]);

  async function handleSend(text: string) {
    if (stream) return; // already streaming
    setStream({ userText: text, assistantText: '' });

    let convId = conversationId;
    let userMessage: Message | null = null;

    try {
      await chatApi.stream(
        { conversationId: conversationId ?? undefined, message: text },
        (event) => {
          if (!mounted.current) return;
          switch (event.type) {
            case 'meta':
              convId = event.conversationId;
              userMessage = event.userMessage;
              break;
            case 'delta':
              setStream((s) => (s ? { ...s, assistantText: s.assistantText + event.text } : s));
              break;
            case 'done':
              if (convId && userMessage) {
                // Seed the cache so the persisted pair renders without a refetch
                // flicker (and is already present after navigation).
                qc.setQueryData<Message[]>(['messages', convId], (old) => [
                  ...(old ?? []),
                  userMessage as Message,
                  event.assistantMessage,
                ]);
              }
              void qc.invalidateQueries({ queryKey: ['conversations'] });
              setStream(null);
              if (!conversationId && convId) router.replace(`/chat/${convId}`);
              break;
            case 'error':
              toast.error(event.message);
              setStream(null);
              break;
          }
        },
      );
    } catch (err) {
      if (mounted.current) {
        toast.error(apiErrorMessage(err, 'Failed to send message'));
        setStream(null);
      }
    }
  }

  const showEmpty = (!conversationId || (messages && messages.length === 0)) && !stream;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {isLoading && conversationId && (
            <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>
          )}

          {showEmpty && (
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

            {stream && (
              <>
                {/* Optimistic user bubble (persisted copy replaces it on done). */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{stream.userText}</p>
                  </div>
                </div>
                {/* Streaming assistant bubble. */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                    {stream.assistantText ? (
                      <div className="prose-chat">
                        <ReactMarkdown>{stream.assistantText}</ReactMarkdown>
                        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary align-middle" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={stream !== null} />
    </div>
  );
}
