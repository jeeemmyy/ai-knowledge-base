import { Injectable } from '@nestjs/common';
import type { ChatRole, Message, MessageSource } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface MessageRow {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  sources: MessageSource[];
  created_at: string;
}

const toDomain = (r: MessageRow): Message => ({
  id: r.id,
  conversationId: r.conversation_id,
  role: r.role,
  content: r.content,
  sources: r.sources ?? [],
  createdAt: r.created_at,
});

@Injectable()
export class MessagesRepository {
  constructor(private readonly supabase: SupabaseService) {}
  private get db() {
    return this.supabase.admin.from('messages');
  }

  async listByConversation(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`listByConversation failed: ${error.message}`);
    return (data as MessageRow[]).map(toDomain);
  }

  /** Last N messages for building short-term chat history (chronological). */
  async recentByConversation(conversationId: string, limit: number): Promise<Message[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`recentByConversation failed: ${error.message}`);
    return (data as MessageRow[]).map(toDomain).reverse();
  }

  async insert(
    conversationId: string,
    role: ChatRole,
    content: string,
    sources: MessageSource[] = [],
  ): Promise<Message> {
    const { data, error } = await this.db
      .insert({ conversation_id: conversationId, role, content, sources })
      .select('*')
      .single();
    if (error) throw new Error(`insert failed: ${error.message}`);
    return toDomain(data as MessageRow);
  }
}
