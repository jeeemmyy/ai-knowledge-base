'use client';
import axios, { type AxiosInstance } from 'axios';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Shared axios instance. A request interceptor attaches the current Supabase
 * access token as a Bearer header, so every API call is authenticated without
 * each caller wiring it up.
 */
export const api: AxiosInstance = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

/** Normalize API errors into a readable message for toasts. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
