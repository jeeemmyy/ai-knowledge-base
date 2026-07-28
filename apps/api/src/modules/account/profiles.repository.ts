import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminUser } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

export interface UserProfile {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  verificationCode: string | null;
  verificationExpiresAt: string | null;
  verificationSentAt: string | null;
  resetCode: string | null;
  resetExpiresAt: string | null;
  resetSentAt: string | null;
}

interface ProfileRow {
  user_id: string;
  email: string | null;
  email_verified: boolean;
  verification_code: string | null;
  verification_expires_at: string | null;
  verification_sent_at: string | null;
  reset_code: string | null;
  reset_expires_at: string | null;
  reset_sent_at: string | null;
}

const toDomain = (r: ProfileRow): UserProfile => ({
  userId: r.user_id,
  email: r.email,
  emailVerified: r.email_verified,
  verificationCode: r.verification_code,
  verificationExpiresAt: r.verification_expires_at,
  verificationSentAt: r.verification_sent_at,
  resetCode: r.reset_code,
  resetExpiresAt: r.reset_expires_at,
  resetSentAt: r.reset_sent_at,
});

@Injectable()
export class ProfilesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.admin.from('user_profiles');
  }

  async getByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.db.select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new Error(`profile getByUserId failed: ${error.message}`);
    return data ? toDomain(data as ProfileRow) : null;
  }

  async getByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await this.db
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    if (error) throw new Error(`profile getByEmail failed: ${error.message}`);
    return data ? toDomain(data as ProfileRow) : null;
  }

  /** Create the profile if missing; returns the current (or new) row. */
  async ensure(userId: string, email: string | null, verified: boolean): Promise<UserProfile> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;
    const { data, error } = await this.db
      .insert({ user_id: userId, email, email_verified: verified })
      .select('*')
      .single();
    if (error) throw new Error(`profile ensure failed: ${error.message}`);
    return toDomain(data as ProfileRow);
  }

  private async patch(userId: string, patch: Partial<ProfileRow>): Promise<void> {
    const { error } = await this.db
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw new Error(`profile update failed: ${error.message}`);
  }

  setVerificationCode(userId: string, code: string, expiresAt: string): Promise<void> {
    return this.patch(userId, {
      verification_code: code,
      verification_expires_at: expiresAt,
      verification_sent_at: new Date().toISOString(),
    });
  }

  markVerified(userId: string): Promise<void> {
    return this.patch(userId, {
      email_verified: true,
      verification_code: null,
      verification_expires_at: null,
    });
  }

  setResetCode(userId: string, code: string, expiresAt: string): Promise<void> {
    return this.patch(userId, {
      reset_code: code,
      reset_expires_at: expiresAt,
      reset_sent_at: new Date().toISOString(),
    });
  }

  clearResetCode(userId: string): Promise<void> {
    return this.patch(userId, { reset_code: null, reset_expires_at: null });
  }

  // --- Admin user management -------------------------------------------------

  async listAll(limit = 200): Promise<AdminUser[]> {
    const { data, error } = await this.db
      .select('user_id, email, email_verified, unlimited, documents_created, messages_sent, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`profile listAll failed: ${error.message}`);
    return (data as AdminUserRow[]).map((r) => ({
      userId: r.user_id,
      email: r.email,
      emailVerified: r.email_verified,
      unlimited: r.unlimited,
      documentsUsed: r.documents_created,
      messagesUsed: r.messages_sent,
      createdAt: r.created_at,
    }));
  }

  async setUnlimited(userId: string, unlimited: boolean): Promise<void> {
    const { data, error } = await this.db
      .update({ unlimited, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('user_id')
      .maybeSingle();
    if (error) throw new Error(`profile setUnlimited failed: ${error.message}`);
    if (!data) throw new NotFoundException('User not found');
  }
}

interface AdminUserRow {
  user_id: string;
  email: string | null;
  email_verified: boolean;
  unlimited: boolean;
  documents_created: number;
  messages_sent: number;
  created_at: string;
}
