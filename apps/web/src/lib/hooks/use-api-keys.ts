'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateApiKeyInput } from '@repo/shared';
import { apiKeysApi } from '@/lib/api/api-keys';
import { apiErrorMessage } from '@/lib/api/client';

const KEY = ['api-keys'];

export function useApiKeys() {
  return useQuery({ queryKey: KEY, queryFn: apiKeysApi.list });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeysApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to create API key')),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('API key revoked');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to revoke API key')),
  });
}
