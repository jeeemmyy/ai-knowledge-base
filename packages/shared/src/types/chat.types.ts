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
