import { ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { isAdminEmail } from '../../common/admin';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

/** Lifetime free-tier caps (removed when a user is flipped to unlimited). */
export const DOCUMENT_LIMIT = 5;
export const MESSAGE_LIMIT = 10;

export interface LimitStatus {
  unlimited: boolean;
  documentsUsed: number;
  documentLimit: number;
  messagesUsed: number;
  messageLimit: number;
}

@Injectable()
export class LimitsService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.admin.from('user_profiles');
  }

  /** Effective status for a user — admins are always unlimited. */
  async getStatus(user: AuthenticatedUser): Promise<LimitStatus> {
    const { data, error } = await this.db
      .select('unlimited, documents_created, messages_sent')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new Error(`limits getStatus failed: ${error.message}`);
    const row = data as
      | { unlimited: boolean; documents_created: number; messages_sent: number }
      | null;
    return {
      unlimited: (row?.unlimited ?? false) || isAdminEmail(user.email),
      documentsUsed: row?.documents_created ?? 0,
      documentLimit: DOCUMENT_LIMIT,
      messagesUsed: row?.messages_sent ?? 0,
      messageLimit: MESSAGE_LIMIT,
    };
  }

  async assertCanCreateDocument(user: AuthenticatedUser): Promise<void> {
    const s = await this.getStatus(user);
    if (!s.unlimited && s.documentsUsed >= DOCUMENT_LIMIT) {
      throw new ForbiddenException(
        `You've reached the free limit of ${DOCUMENT_LIMIT} documents. Ask an admin to unlock unlimited access.`,
      );
    }
  }

  async assertCanSendMessage(user: AuthenticatedUser): Promise<void> {
    const s = await this.getStatus(user);
    if (!s.unlimited && s.messagesUsed >= MESSAGE_LIMIT) {
      throw new ForbiddenException(
        `You've reached the free limit of ${MESSAGE_LIMIT} messages. Ask an admin to unlock unlimited access.`,
      );
    }
  }

  async incrementDocuments(userId: string): Promise<void> {
    const { error } = await this.supabase.admin.rpc('increment_documents_created', {
      p_user_id: userId,
    });
    if (error) throw new Error(`increment documents failed: ${error.message}`);
  }

  async incrementMessages(userId: string): Promise<void> {
    const { error } = await this.supabase.admin.rpc('increment_messages_sent', {
      p_user_id: userId,
    });
    if (error) throw new Error(`increment messages failed: ${error.message}`);
  }
}
