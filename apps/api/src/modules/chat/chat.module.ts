import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { UsageRepository } from './usage.repository';
import { PromptBuilderService } from './prompt-builder.service';
import { AuthModule } from '../auth/auth.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [AuthModule, RagModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationsRepository,
    MessagesRepository,
    UsageRepository,
    PromptBuilderService,
  ],
})
export class ChatModule {}
