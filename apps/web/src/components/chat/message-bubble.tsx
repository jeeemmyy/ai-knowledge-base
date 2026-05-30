'use client';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@repo/shared';
import { cn } from '@/lib/utils';
import { SourceCitations } from './source-citations';

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 animate-fade-in-up',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'border border-border bg-card rounded-bl-md',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : (
          <>
            <div className="prose-chat">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <SourceCitations sources={message.sources} />
          </>
        )}
      </div>
    </div>
  );
}
