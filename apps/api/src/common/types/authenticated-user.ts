export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** Supabase auth provider, e.g. 'email' or 'google'. Absent for API keys. */
  provider?: string;
  /** True when authenticated via X-API-Key rather than a Supabase session. */
  viaApiKey?: boolean;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
