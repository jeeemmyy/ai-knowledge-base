'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SendMessageInput } from '@repo/shared';
import { chatApi } from '@/lib/api/chat';
import { apiErrorMessage } from '@/lib/api/client';

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: chatApi.listConversations });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId as string),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => chatApi.send(input),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['messages', result.conversationId] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to send message')),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to delete conversation')),
  });
}
