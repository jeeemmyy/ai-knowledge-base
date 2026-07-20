export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** True when authenticated via X-API-Key rather than a Supabase session. */
  viaApiKey?: boolean;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
