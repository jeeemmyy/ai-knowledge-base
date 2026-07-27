import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { ConfirmPasswordResetDto, RequestPasswordResetDto } from './dto/password-reset.dto';

/**
 * Public (unauthenticated) password-reset endpoints — the caller is on the
 * sign-in page, not logged in. Responses never reveal whether an email exists.
 */
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly account: AccountService) {}

  @Post('request')
  @HttpCode(200)
  async request(@Body() dto: RequestPasswordResetDto): Promise<{ ok: true }> {
    await this.account.requestPasswordReset(dto.email);
    return { ok: true };
  }

  @Post('confirm')
  @HttpCode(200)
  async confirm(@Body() dto: ConfirmPasswordResetDto): Promise<{ ok: true }> {
    await this.account.confirmPasswordReset(dto.email, dto.code, dto.password);
    return { ok: true };
  }
}
