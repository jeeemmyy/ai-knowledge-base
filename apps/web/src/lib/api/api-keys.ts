'use client';
import type { ApiKey, ApiKeyWithSecret, CreateApiKeyInput } from '@repo/shared';
import { api } from './client';

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const { data } = await api.get<ApiKey[]>('/api-keys');
    return data;
  },
  async create(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    const { data } = await api.post<ApiKeyWithSecret>('/api-keys', input);
    return data;
  },
  async revoke(id: string): Promise<void> {
    await api.delete(`/api-keys/${id}`);
  },
};
