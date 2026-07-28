'use client';
import type {
  AdminSettings,
  AdminUser,
  MeResponse,
  StartVerificationResult,
  UpdateAdminSettingsInput,
} from '@repo/shared';
import { api } from './client';

export const accountApi = {
  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
  },
  async startVerification(): Promise<StartVerificationResult> {
    const { data } = await api.post<StartVerificationResult>('/auth/verification/start', {});
    return data;
  },
  async confirmVerification(code: string): Promise<MeResponse> {
    const { data } = await api.post<MeResponse>('/auth/verification/confirm', { code });
    return data;
  },

  // Public (no session) — the user is on the sign-in page.
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/password-reset/request', { email });
  },
  async confirmPasswordReset(email: string, code: string, password: string): Promise<void> {
    await api.post('/auth/password-reset/confirm', { email, code, password });
  },

  // Admin.
  async getAdminSettings(): Promise<AdminSettings> {
    const { data } = await api.get<AdminSettings>('/admin/settings');
    return data;
  },
  async updateAdminSettings(input: UpdateAdminSettingsInput): Promise<AdminSettings> {
    const { data } = await api.put<AdminSettings>('/admin/settings', input);
    return data;
  },
  async sendTestEmail(to: string): Promise<void> {
    await api.post('/admin/settings/test', { to });
  },
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await api.get<AdminUser[]>('/admin/users');
    return data;
  },
  async setUserUnlimited(userId: string, unlimited: boolean): Promise<AdminUser[]> {
    const { data } = await api.patch<AdminUser[]>(`/admin/users/${userId}`, { unlimited });
    return data;
  },
};
