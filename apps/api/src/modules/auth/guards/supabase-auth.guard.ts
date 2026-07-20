import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';

/**
 * Two ways in, one request contract:
 *
 * 1. `Authorization: Bearer <supabase_access_token>` — the web app's flow.
 * 2. `X-API-Key: dbk_...` — per-user keys created in Settings -> API, for
 *    server-to-server clients (e.g. a Bubble frontend). The key maps to its
 *    owning user, so all ownership scoping works identically.
 *
 * Either way the authenticated user lands on req.user; controllers use the
 * user id for ownership checks. RLS in the database is the second layer.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const apiKeyHeader = req.headers['x-api-key'];
    if (typeof apiKeyHeader === 'string' && apiKeyHeader.length > 0) {
      const user = await this.apiKeys.resolveUser(apiKeyHeader.trim());
      if (!user) {
        throw new UnauthorizedException('Invalid API key');
      }
      req.user = user;
      return true;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    const user = await this.supabase.getUserFromToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    req.user = user;
    return true;
  }
}
