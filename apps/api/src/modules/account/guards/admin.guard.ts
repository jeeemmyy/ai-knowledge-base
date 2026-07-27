import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { isAdminEmail } from '../account.service';

/**
 * Allows only users whose email is listed in ADMIN_EMAILS. Runs after
 * SupabaseAuthGuard, which populates req.user. API-key callers (no session
 * email) are never admins.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.user?.viaApiKey || !isAdminEmail(req.user?.email)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
