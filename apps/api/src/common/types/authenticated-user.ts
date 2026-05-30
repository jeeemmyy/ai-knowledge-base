export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
