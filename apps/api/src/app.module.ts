import { Module } from '@nestjs/common';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { RagModule } from './modules/rag/rag.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EmailModule } from './modules/email/email.module';
import { LimitsModule } from './modules/limits/limits.module';
import { AccountModule } from './modules/account/account.module';
import { HealthController } from './health/health.controller';
import { RootController } from './health/root.controller';

/**
 * Root module. AiModule and SupabaseModule are @Global, so their providers are
 * available everywhere without re-importing.
 */
@Module({
  imports: [
    SupabaseModule, // global: SupabaseService
    AiModule, // global: AiService (provider-agnostic)
    SettingsModule, // global: AppSettingsRepository
    EmailModule, // global: EmailService (SendGrid)
    LimitsModule, // global: LimitsService (per-user usage caps)
    AuthModule,
    ApiKeysModule, // global: ApiKeysService (used by SupabaseAuthGuard)
    AccountModule, // /auth/me, verification, password reset, /admin settings
    RagModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [HealthController, RootController],
})
export class AppModule {}
