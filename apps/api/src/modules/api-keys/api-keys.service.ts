import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { ApiKey, ApiKeyWithSecret } from '@repo/shared';
import { ApiKeysRepository } from './api-keys.repository';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

const KEY_PREFIX = 'dbk_';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly repo: ApiKeysRepository) {}

  /** Create a key for the user. The plaintext is returned once, never stored. */
  async create(userId: string, name?: string): Promise<ApiKeyWithSecret> {
    const key = KEY_PREFIX + randomBytes(24).toString('hex');
    const created = await this.repo.create(userId, {
      name: name?.trim() || 'API key',
      keyHash: hashKey(key),
      keyPrefix: key.slice(0, KEY_PREFIX.length + 4),
    });
    return { ...created, key };
  }

  list(userId: string): Promise<ApiKey[]> {
    return this.repo.listByUser(userId);
  }

  revoke(id: string, userId: string): Promise<void> {
    return this.repo.deleteForUser(id, userId);
  }

  /** Resolve an X-API-Key header value to its owner, or null. */
  async resolveUser(key: string): Promise<AuthenticatedUser | null> {
    if (!key.startsWith(KEY_PREFIX)) return null;
    const keyHash = hashKey(key);
    const userId = await this.repo.findUserIdByHash(keyHash);
    if (!userId) return null;
    this.repo.touchLastUsed(keyHash);
    return { id: userId, email: null, viaApiKey: true };
  }
}
