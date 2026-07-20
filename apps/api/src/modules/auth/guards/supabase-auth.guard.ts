import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { SupabaseService } from '../../../common/supabase/supabase.service';

/**
 * Validates the `Authorization: Bearer <supabase_access_token>` header and
 * attaches the authenticated user to the request. Controllers then use the
 * user id for ownership checks. RLS in the database is the second layer.
 *
 * Optionally, when SERVICE_API_KEY and SERVICE_API_KEY_USER_ID are both set,
 * an `X-API-Key` header matching SERVICE_API_KEY authenticates as that fixed
 * user. Intended for server-to-server clients (e.g. a Bubble app) that cannot
 * run the Supabase browser auth flow. Disabled unless both vars are present.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const serviceKey = process.env.SERVICE_API_KEY;
    const serviceUserId = process.env.SERVICE_API_KEY_USER_ID;
    const apiKeyHeader = req.headers['x-api-key'];
    if (serviceKey && serviceUserId && typeof apiKeyHeader === 'string') {
      const expected = Buffer.from(serviceKey);
      const given = Buffer.from(apiKeyHeader);
      if (expected.length === given.length && timingSafeEqual(expected, given)) {
        req.user = { id: serviceUserId, email: null };
        return true;
      }
      throw new UnauthorizedException('Invalid API key');
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
