import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiKey } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

function toDomain(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

@Injectable()
export class ApiKeysRepository {
  private readonly table = 'api_keys';

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.admin.from(this.table);
  }

  async create(
    userId: string,
    input: { name: string; keyHash: string; keyPrefix: string },
  ): Promise<ApiKey> {
    const { data, error } = await this.db
      .insert({
        user_id: userId,
        name: input.name,
        key_hash: input.keyHash,
        key_prefix: input.keyPrefix,
      })
      .select('*')
      .single();
    if (error) throw new Error(`create failed: ${error.message}`);
    return toDomain(data as ApiKeyRow);
  }

  async listByUser(userId: string): Promise<ApiKey[]> {
    const { data, error } = await this.db
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`listByUser failed: ${error.message}`);
    return (data as ApiKeyRow[]).map(toDomain);
  }

  async deleteForUser(id: string, userId: string): Promise<void> {
    const { error, count } = await this.supabase.admin
      .from(this.table)
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`delete failed: ${error.message}`);
    if (!count) throw new NotFoundException('API key not found');
  }

  /** Resolve a key hash to its owning user id, or null. */
  async findUserIdByHash(keyHash: string): Promise<string | null> {
    const { data, error } = await this.db
      .select('user_id')
      .eq('key_hash', keyHash)
      .maybeSingle();
    if (error) throw new Error(`findUserIdByHash failed: ${error.message}`);
    return (data as Pick<ApiKeyRow, 'user_id'> | null)?.user_id ?? null;
  }

  /** Best-effort usage timestamp; failures are deliberately swallowed. */
  touchLastUsed(keyHash: string): void {
    void this.db
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)
      .then(() => undefined);
  }
}
