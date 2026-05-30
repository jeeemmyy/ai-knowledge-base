import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Owns the Supabase clients.
 *
 * `admin` uses the service_role key and BYPASSES RLS — it is the client the
 * repositories use, with ownership always enforced in application code (and
 * RLS as a second layer for any non-service access). Never expose this client
 * or its key to the browser.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  public readonly admin: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** Validate a Supabase access token and return the user, or null. */
  async getUserFromToken(accessToken: string): Promise<AuthenticatedUser | null> {
    const { data, error } = await this.admin.auth.getUser(accessToken);
    if (error || !data.user) {
      this.logger.debug(`Token validation failed: ${error?.message ?? 'no user'}`);
      return null;
    }
    return { id: data.user.id, email: data.user.email ?? null };
  }
}
