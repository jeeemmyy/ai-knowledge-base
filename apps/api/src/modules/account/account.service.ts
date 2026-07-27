import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type {
  AdminSettings,
  MeResponse,
  StartVerificationResult,
  UpdateAdminSettingsInput,
} from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AppSettingsRepository, SETTINGS_KEYS } from '../settings/app-settings.repository';
import { EmailService } from '../email/email.service';
import { ProfilesRepository } from './profiles.repository';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_THROTTLE_MS = 30 * 1000;

/** Admin emails from ADMIN_EMAILS (comma-separated), lower-cased. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

function sixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function isExpired(iso: string | null): boolean {
  return !iso || Date.now() > new Date(iso).getTime();
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly profiles: ProfilesRepository,
    private readonly email: EmailService,
    private readonly settings: AppSettingsRepository,
  ) {}

  /** Verified-by-default for OAuth users (Google already verified the email). */
  private verifiedDefault(user: AuthenticatedUser): boolean {
    return (user.provider ?? 'email') !== 'email';
  }

  async getMe(user: AuthenticatedUser): Promise<MeResponse> {
    const profile = await this.profiles.ensure(user.id, user.email, this.verifiedDefault(user));
    // When email delivery isn't set up, verification can't be enforced — treat
    // everyone as verified so the app is never unusable before SendGrid config.
    const emailVerified = profile.emailVerified || !(await this.email.isConfigured());
    return {
      id: user.id,
      email: user.email,
      emailVerified,
      isAdmin: isAdminEmail(user.email),
    };
  }

  async startVerification(user: AuthenticatedUser): Promise<StartVerificationResult> {
    const profile = await this.profiles.ensure(user.id, user.email, this.verifiedDefault(user));
    if (profile.emailVerified) return { sent: false, alreadyVerified: true };

    if (!(await this.email.isConfigured())) {
      return {
        sent: false,
        alreadyVerified: false,
        message: 'Email verification is unavailable until an admin configures SendGrid.',
      };
    }
    if (!user.email) {
      return { sent: false, alreadyVerified: false, message: 'No email on this account.' };
    }
    if (
      profile.verificationSentAt &&
      Date.now() - new Date(profile.verificationSentAt).getTime() < RESEND_THROTTLE_MS
    ) {
      return { sent: false, alreadyVerified: false, message: 'Please wait before requesting a new code.' };
    }

    const code = sixDigitCode();
    await this.profiles.setVerificationCode(user.id, code, new Date(Date.now() + CODE_TTL_MS).toISOString());
    await this.email.sendVerificationCode(user.email, code);
    return { sent: true, alreadyVerified: false };
  }

  async confirmVerification(user: AuthenticatedUser, code: string): Promise<MeResponse> {
    const profile = await this.profiles.ensure(user.id, user.email, this.verifiedDefault(user));
    if (profile.emailVerified) return this.getMe(user);

    if (!profile.verificationCode || isExpired(profile.verificationExpiresAt)) {
      throw new BadRequestException('Your code has expired. Request a new one.');
    }
    if (code.trim() !== profile.verificationCode) {
      throw new BadRequestException('That code is incorrect.');
    }
    await this.profiles.markVerified(user.id);
    return this.getMe(user);
  }

  // --- Password reset (public: caller is not authenticated) ------------------

  /** Always resolves without revealing whether the email exists. */
  async requestPasswordReset(email: string): Promise<void> {
    const profile = await this.profiles.getByEmail(email);
    if (!profile || !profile.email) return;
    if (!(await this.email.isConfigured())) {
      this.logger.warn('Password reset requested but email is not configured');
      return;
    }
    if (
      profile.resetSentAt &&
      Date.now() - new Date(profile.resetSentAt).getTime() < RESEND_THROTTLE_MS
    ) {
      return;
    }
    const code = sixDigitCode();
    await this.profiles.setResetCode(profile.userId, code, new Date(Date.now() + CODE_TTL_MS).toISOString());
    await this.email.sendPasswordResetCode(profile.email, code);
  }

  async confirmPasswordReset(email: string, code: string, password: string): Promise<void> {
    const profile = await this.profiles.getByEmail(email);
    if (!profile || !profile.resetCode || isExpired(profile.resetExpiresAt)) {
      throw new BadRequestException('Invalid or expired reset code.');
    }
    if (code.trim() !== profile.resetCode) {
      throw new BadRequestException('That reset code is incorrect.');
    }
    const { error } = await this.supabase.admin.auth.admin.updateUserById(profile.userId, {
      password,
    });
    if (error) throw new BadRequestException(error.message);
    await this.profiles.clearResetCode(profile.userId);
  }

  // --- Admin settings --------------------------------------------------------

  async getAdminSettings(): Promise<AdminSettings> {
    const values = await this.settings.getMany([
      SETTINGS_KEYS.sendgridApiKey,
      SETTINGS_KEYS.sendgridFromEmail,
      SETTINGS_KEYS.sendgridFromName,
    ]);
    return {
      sendgridConfigured: !!values[SETTINGS_KEYS.sendgridApiKey] && !!values[SETTINGS_KEYS.sendgridFromEmail],
      fromEmail: values[SETTINGS_KEYS.sendgridFromEmail],
      fromName: values[SETTINGS_KEYS.sendgridFromName],
    };
  }

  async updateAdminSettings(input: UpdateAdminSettingsInput): Promise<AdminSettings> {
    // Only overwrite the API key when a non-empty value is supplied, so saving
    // other fields never wipes the stored key.
    if (input.sendgridApiKey && input.sendgridApiKey.trim()) {
      await this.settings.set(SETTINGS_KEYS.sendgridApiKey, input.sendgridApiKey.trim());
    }
    if (input.fromEmail !== undefined) {
      await this.settings.set(SETTINGS_KEYS.sendgridFromEmail, input.fromEmail.trim());
    }
    if (input.fromName !== undefined) {
      await this.settings.set(SETTINGS_KEYS.sendgridFromName, input.fromName.trim());
    }
    return this.getAdminSettings();
  }

  async sendTestEmail(to: string): Promise<void> {
    if (!(await this.email.isConfigured())) {
      throw new BadRequestException('Configure and save SendGrid settings first.');
    }
    await this.email.sendTest(to);
  }
}
