import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Conversation, Message, SendMessageResult } from '@repo/shared';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser): Promise<Conversation[]> {
    return this.chat.listConversations(user.id);
  }

  @Post('conversations')
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Conversation> {
    return this.chat.createConversation(user.id, dto.title);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Message[]> {
    return this.chat.getMessages(id, user.id);
  }

  @Delete('conversations/:id')
  @HttpCode(204)
  async deleteConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.chat.deleteConversation(id, user.id);
  }

  @Post('chat')
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SendMessageResult> {
    return this.chat.sendMessage(user.id, dto);
  }
}
