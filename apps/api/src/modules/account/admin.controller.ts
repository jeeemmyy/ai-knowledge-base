import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { AdminSettings, AdminUser } from '@repo/shared';
import { AccountService } from './account.service';
import { UpdateAdminSettingsDto, TestEmailDto } from './dto/admin-settings.dto';
import { SetUnlimitedDto } from './dto/admin-users.dto';
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

  @Get('users')
  listUsers(): Promise<AdminUser[]> {
    return this.account.listUsers();
  }

  @Patch('users/:id')
  setUnlimited(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUnlimitedDto,
  ): Promise<AdminUser[]> {
    return this.account.setUserUnlimited(id, dto.unlimited);
  }
}
