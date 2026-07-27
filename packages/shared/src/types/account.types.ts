/** The current user's account state (GET /auth/me). */
export interface MeResponse {
  id: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

/** Result of starting email verification (POST /auth/verification/start). */
export interface StartVerificationResult {
  /** True when a code was emailed; false when already verified or email off. */
  sent: boolean;
  alreadyVerified: boolean;
  /** Present when email is not configured / could not be sent. */
  message?: string;
}

/** Admin view of SendGrid settings — never exposes the raw API key. */
export interface AdminSettings {
  sendgridConfigured: boolean;
  fromEmail: string | null;
  fromName: string | null;
}

export interface UpdateAdminSettingsInput {
  sendgridApiKey?: string;
  fromEmail?: string;
  fromName?: string;
}
