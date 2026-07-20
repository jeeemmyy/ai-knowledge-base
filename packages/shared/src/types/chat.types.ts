import type { ChatRole } from './ai.types';

/** A retrieved chunk recorded on an assistant message for citations. */
export interface MessageSource {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  excerpt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  sources: MessageSource[];
  createdAt: string;
}

export interface SendMessageInput {
  conversationId?: string;
  message: string;
}

export interface SendMessageResult {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
}

/**
 * Events emitted over the streaming chat endpoint (POST /chat/stream), one JSON
 * object per SSE `data:` frame:
 *   meta  — sent first: the conversation id and the persisted user message
 *   delta — an incremental piece of the assistant's answer
 *   done  — the fully persisted assistant message (with citations)
 *   error — a human-readable failure message; the stream then ends
 */
export type ChatStreamEvent =
  | { type: 'meta'; conversationId: string; userMessage: Message }
  | { type: 'delta'; text: string }
  | { type: 'done'; assistantMessage: Message }
  | { type: 'error'; message: string };
