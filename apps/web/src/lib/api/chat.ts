'use client';
import type {
  ChatStreamEvent,
  Conversation,
  Message,
  SendMessageInput,
  SendMessageResult,
} from '@repo/shared';
import { api } from './client';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { requestStarted, requestSettled } from './server-status';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const chatApi = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations');
    return data;
  },
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
    return data;
  },
  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/conversations/${conversationId}`);
  },
  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const { data } = await api.post<SendMessageResult>('/chat', input);
    return data;
  },

  /**
   * Stream a chat answer over SSE. Invokes `onEvent` for each ChatStreamEvent
   * (meta -> deltas -> done | error). Uses fetch (axios can't stream in the
   * browser) but still feeds the cold-start banner via requestStarted/Settled.
   */
  async stream(
    input: SendMessageInput,
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    requestStarted();
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        requestSettled(true);
      }
    };

    try {
      const res = await fetch(`${baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(input),
        signal,
      });
      settle(); // response headers arrived — the server is reachable

      if (!res.ok || !res.body) {
        throw new Error(`Stream request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const json = line.slice('data:'.length).trim();
          if (!json) continue;
          onEvent(JSON.parse(json) as ChatStreamEvent);
        }
      }
    } catch (err) {
      settle();
      if ((err as Error).name === 'AbortError') return;
      throw err;
    }
  },
};
