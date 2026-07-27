import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { PasswordResetController } from './password-reset.controller';
import { AdminController } from './admin.controller';
import { AccountService } from './account.service';
import { ProfilesRepository } from './profiles.repository';
import { AdminGuard } from './guards/admin.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // SupabaseAuthGuard
  controllers: [AccountController, PasswordResetController, AdminController],
  providers: [AccountService, ProfilesRepository, AdminGuard],
})
export class AccountModule {}
