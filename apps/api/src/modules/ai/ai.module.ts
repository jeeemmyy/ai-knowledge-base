import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CHAT_PROVIDER } from './interfaces/chat-provider.interface';
import { EMBEDDING_PROVIDER } from './interfaces/embedding-provider.interface';
import { createChatProvider } from './factories/chat-provider.factory';
import { createEmbeddingProvider } from './factories/embedding-provider.factory';

/**
 * Global so AiService is injectable anywhere without re-importing.
 * The two providers are supplied via factory functions that read env config —
 * swapping a provider is a .env change, never a code change here.
 */
@Global()
@Module({
  providers: [
    AiService,
    { provide: CHAT_PROVIDER, useFactory: createChatProvider },
    { provide: EMBEDDING_PROVIDER, useFactory: createEmbeddingProvider },
  ],
  exports: [AiService],
})
export class AiModule {}
