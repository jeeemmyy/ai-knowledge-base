import { Module } from '@nestjs/common';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { RagModule } from './modules/rag/rag.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { HealthController } from './health/health.controller';

/**
 * Root module. AiModule and SupabaseModule are @Global, so their providers are
 * available everywhere without re-importing.
 */
@Module({
  imports: [
    SupabaseModule, // global: SupabaseService
    AiModule, // global: AiService (provider-agnostic)
    AuthModule,
    RagModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
