import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

/** Known keys in the app_settings KV table. */
export const SETTINGS_KEYS = {
  sendgridApiKey: 'sendgrid_api_key',
  sendgridFromEmail: 'sendgrid_from_email',
  sendgridFromName: 'sendgrid_from_name',
} as const;

@Injectable()
export class AppSettingsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.admin.from('app_settings');
  }

  async get(key: string): Promise<string | null> {
    const { data, error } = await this.db.select('value').eq('key', key).maybeSingle();
    if (error) throw new Error(`settings get failed: ${error.message}`);
    return (data as { value: string | null } | null)?.value ?? null;
  }

  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    const { data, error } = await this.db.select('key, value').in('key', keys);
    if (error) throw new Error(`settings getMany failed: ${error.message}`);
    const out: Record<string, string | null> = {};
    for (const key of keys) out[key] = null;
    for (const row of (data ?? []) as { key: string; value: string | null }[]) {
      out[row.key] = row.value;
    }
    return out;
  }

  async set(key: string, value: string): Promise<void> {
    const { error } = await this.db.upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
    if (error) throw new Error(`settings set failed: ${error.message}`);
  }
}
