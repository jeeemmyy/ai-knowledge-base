import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { MeResponse, StartVerificationResult } from '@repo/shared';
import { AccountService } from './account.service';
import { ConfirmVerificationDto } from './dto/verification.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.account.getMe(user);
  }

  @Post('verification/start')
  startVerification(@CurrentUser() user: AuthenticatedUser): Promise<StartVerificationResult> {
    return this.account.startVerification(user);
  }

  @Post('verification/confirm')
  confirmVerification(
    @Body() dto: ConfirmVerificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeResponse> {
    return this.account.confirmVerification(user, dto.code);
  }
}
