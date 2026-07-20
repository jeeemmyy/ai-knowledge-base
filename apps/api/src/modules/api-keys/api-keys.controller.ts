import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ApiKey, ApiKeyWithSecret } from '@repo/shared';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

/** A leaked key must not be able to mint or manage keys. */
function requireSession(user: AuthenticatedUser): void {
  if (user.viaApiKey) {
    throw new ForbiddenException('API keys cannot be managed with API-key authentication');
  }
}

@Controller('api-keys')
@UseGuards(SupabaseAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<ApiKey[]> {
    requireSession(user);
    return this.apiKeys.list(user.id);
  }

  @Post()
  create(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiKeyWithSecret> {
    requireSession(user);
    return this.apiKeys.create(user.id, dto.name);
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    requireSession(user);
    await this.apiKeys.revoke(id, user.id);
  }
}
