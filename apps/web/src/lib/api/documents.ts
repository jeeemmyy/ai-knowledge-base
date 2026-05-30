'use client';
import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@repo/shared';
import { api } from './client';

export const documentsApi = {
  async list(): Promise<Document[]> {
    const { data } = await api.get<Document[]>('/documents');
    return data;
  },
  async get(id: string): Promise<Document> {
    const { data } = await api.get<Document>(`/documents/${id}`);
    return data;
  },
  async create(input: CreateDocumentInput): Promise<Document> {
    const { data } = await api.post<Document>('/documents', input);
    return data;
  },
  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const { data } = await api.patch<Document>(`/documents/${id}`, input);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
