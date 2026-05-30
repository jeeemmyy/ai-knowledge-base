import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

/** Inject the authenticated user (set by SupabaseAuthGuard) into a handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      // Should never happen if the guard ran; defensive for misconfiguration.
      throw new Error('CurrentUser used on a route without SupabaseAuthGuard');
    }
    return req.user;
  },
);
