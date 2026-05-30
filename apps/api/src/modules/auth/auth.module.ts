import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

/**
 * Auth is token-validation only (Supabase owns signup/login). This module
 * provides the guard; SupabaseModule (global) supplies SupabaseService.
 */
@Module({
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
