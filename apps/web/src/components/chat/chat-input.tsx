'use client';
import { useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  return (
    <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          onChange={autoGrow}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask a question about your documents…"
          disabled={disabled}
          className={cn(
            'flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-[15px] leading-relaxed',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-60',
          )}
        />
        <Button size="icon" className="h-12 w-12 shrink-0 rounded-xl" onClick={submit}
          disabled={disabled || !value.trim()} aria-label="Send">
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
        Answers are grounded in your documents. <kbd className="font-mono">Enter</kbd> to send,
        <kbd className="ml-1 font-mono">Shift+Enter</kbd> for a new line.
      </p>
    </div>
  );
}
