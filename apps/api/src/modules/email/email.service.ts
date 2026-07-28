import { Injectable, Logger } from '@nestjs/common';
import { AppSettingsRepository, SETTINGS_KEYS } from '../settings/app-settings.repository';

// Brevo (free tier: 300 emails/day, single verified sender — no domain needed).
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_NAME = 'DocBrain';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly settings: AppSettingsRepository) {}

  /** Load email config from app_settings, or null when not fully set. */
  private async loadConfig(): Promise<EmailConfig | null> {
    const values = await this.settings.getMany([
      SETTINGS_KEYS.emailApiKey,
      SETTINGS_KEYS.emailFromEmail,
      SETTINGS_KEYS.emailFromName,
    ]);
    const apiKey = values[SETTINGS_KEYS.emailApiKey];
    const fromEmail = values[SETTINGS_KEYS.emailFromEmail];
    if (!apiKey || !fromEmail) return null;
    return { apiKey, fromEmail, fromName: values[SETTINGS_KEYS.emailFromName] || DEFAULT_FROM_NAME };
  }

  async isConfigured(): Promise<boolean> {
    return (await this.loadConfig()) !== null;
  }

  /** Low-level send via Brevo. Throws when unconfigured or the call fails. */
  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config) throw new Error('Email is not configured');

    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: config.fromEmail, name: config.fromName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Brevo send failed (${res.status}): ${body.slice(0, 300)}`);
      throw new Error(`Email provider responded ${res.status}`);
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    await this.send(
      to,
      'Verify your DocBrain email',
      codeEmailHtml('Verify your email', 'Enter this code to finish creating your account:', code),
      `Your DocBrain verification code is ${code}. It expires in 15 minutes.`,
    );
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    await this.send(
      to,
      'Reset your DocBrain password',
      codeEmailHtml('Reset your password', 'Use this code to set a new password:', code),
      `Your DocBrain password reset code is ${code}. It expires in 15 minutes.`,
    );
  }

  /** Admin "send test email" — verifies the email config works. */
  async sendTest(to: string): Promise<void> {
    await this.send(
      to,
      'DocBrain email is working',
      codeEmailHtml('Test email', 'Your Brevo email integration is configured correctly.', '✓'),
      'Your Brevo email integration is configured correctly.',
    );
  }
}

/** Minimal, self-contained HTML email (no external assets). */
function codeEmailHtml(title: string, intro: string, code: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:700;font-family:Georgia,serif">DocBrain</div>
    <h1 style="font-size:20px;margin:24px 0 8px">${title}</h1>
    <p style="font-size:14px;color:#57534e;margin:0 0 20px">${intro}</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#fff;border:1px solid #e7e2d9;border-radius:12px;padding:18px;text-align:center">${code}</div>
    <p style="font-size:12px;color:#9a948c;margin-top:20px">This code expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
  </div></body></html>`;
}
