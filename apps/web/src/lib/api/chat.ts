'use client';
import type { Conversation, Message, SendMessageInput, SendMessageResult } from '@repo/shared';
import { api } from './client';

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
};
