import { Injectable, NotFoundException } from '@nestjs/common';
import type { Document } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface DocumentRow {
  id: string;
  user_id: string;
  source_file_id: string | null;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

function toDomain(row: DocumentRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    sourceFileId: row.source_file_id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class DocumentsRepository {
  private readonly table = 'documents';

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.admin.from(this.table);
  }

  async findAllByUser(userId: string): Promise<Document[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`findAllByUser failed: ${error.message}`);
    return (data as DocumentRow[]).map(toDomain);
  }

  async findByIdForUser(id: string, userId: string): Promise<Document> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`findByIdForUser failed: ${error.message}`);
    if (!data) throw new NotFoundException('Document not found');
    return toDomain(data as DocumentRow);
  }

  async create(
    userId: string,
    input: { title: string; content: string; tags: string[] },
  ): Promise<Document> {
    const { data, error } = await this.db
      .insert({ user_id: userId, title: input.title, content: input.content, tags: input.tags })
      .select('*')
      .single();
    if (error) throw new Error(`create failed: ${error.message}`);
    return toDomain(data as DocumentRow);
  }

  async update(
    id: string,
    userId: string,
    patch: Partial<{ title: string; content: string; tags: string[] }>,
  ): Promise<Document> {
    const { data, error } = await this.db
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(`update failed: ${error.message}`);
    if (!data) throw new NotFoundException('Document not found');
    return toDomain(data as DocumentRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    // Chunks are removed via ON DELETE CASCADE at the database level.
    const { error, count } = await this.supabase.admin
      .from(this.table)
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`delete failed: ${error.message}`);
    if (!count) throw new NotFoundException('Document not found');
  }
}
