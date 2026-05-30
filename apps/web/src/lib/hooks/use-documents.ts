'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateDocumentInput, UpdateDocumentInput } from '@repo/shared';
import { documentsApi } from '@/lib/api/documents';
import { apiErrorMessage } from '@/lib/api/client';

const KEY = ['documents'];

export function useDocuments() {
  return useQuery({ queryKey: KEY, queryFn: documentsApi.list });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: ['documents', id], queryFn: () => documentsApi.get(id), enabled: !!id });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Document created and indexed');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to create document')),
  });
}

export function useUpdateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) => documentsApi.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ['documents', id] });
      toast.success('Document updated');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to update document')),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Document deleted');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to delete document')),
  });
}
