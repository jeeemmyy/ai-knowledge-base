import { Injectable, NotFoundException } from '@nestjs/common';
import type { Conversation } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const toDomain = (r: ConversationRow): Conversation => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

@Injectable()
export class ConversationsRepository {
  constructor(private readonly supabase: SupabaseService) {}
  private get db() {
    return this.supabase.admin.from('conversations');
  }

  async listByUser(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`listByUser failed: ${error.message}`);
    return (data as ConversationRow[]).map(toDomain);
  }

  async create(userId: string, title: string): Promise<Conversation> {
    const { data, error } = await this.db
      .insert({ user_id: userId, title })
      .select('*')
      .single();
    if (error) throw new Error(`create failed: ${error.message}`);
    return toDomain(data as ConversationRow);
  }

  async getForUser(id: string, userId: string): Promise<Conversation> {
    const { data, error } = await this.db
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`getForUser failed: ${error.message}`);
    if (!data) throw new NotFoundException('Conversation not found');
    return toDomain(data as ConversationRow);
  }

  async touch(id: string): Promise<void> {
    // Bump updated_at so the sidebar re-sorts to most-recent-first.
    const { error } = await this.db.update({ updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(`touch failed: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error, count } = await this.supabase.admin
      .from('conversations')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`delete failed: ${error.message}`);
    if (!count) throw new NotFoundException('Conversation not found');
  }
}
