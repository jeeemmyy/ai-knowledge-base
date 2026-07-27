import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import type { AdminSettings } from '@repo/shared';
import { AccountService } from './account.service';
import { UpdateAdminSettingsDto, TestEmailDto } from './dto/admin-settings.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly account: AccountService) {}

  @Get('settings')
  getSettings(): Promise<AdminSettings> {
    return this.account.getAdminSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateAdminSettingsDto): Promise<AdminSettings> {
    return this.account.updateAdminSettings(dto);
  }

  @Post('settings/test')
  @HttpCode(200)
  async sendTest(@Body() dto: TestEmailDto): Promise<{ ok: true }> {
    await this.account.sendTestEmail(dto.to);
    return { ok: true };
  }
}
