import { Injectable } from '@nestjs/common';
import type { Conversation, Message, SendMessageResult } from '@repo/shared';
import { truncate } from '@repo/utils';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { UsageRepository } from './usage.repository';
import { PromptBuilderService } from './prompt-builder.service';
import { RagService } from '../rag/rag.service';
import { ChunksRepository } from '../rag/chunks.repository';
import { AiService } from '../ai/ai.service';

const HISTORY_LIMIT = 10; // last N messages sent to the model (CH-04)
const TOP_K = 5;

@Injectable()
export class ChatService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly usage: UsageRepository,
    private readonly prompt: PromptBuilderService,
    private readonly rag: RagService,
    private readonly ai: AiService,
  ) {}

  listConversations(userId: string): Promise<Conversation[]> {
    return this.conversations.listByUser(userId);
  }

  createConversation(userId: string, title?: string): Promise<Conversation> {
    return this.conversations.create(userId, title?.trim() || 'New conversation');
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    await this.conversations.getForUser(conversationId, userId); // ownership check
    return this.messages.listByConversation(conversationId);
  }

  deleteConversation(conversationId: string, userId: string): Promise<void> {
    return this.conversations.delete(conversationId, userId);
  }

  /**
   * The core RAG chat flow:
   *   1. resolve/create the conversation (ownership-checked)
   *   2. persist the user message
   *   3. retrieve relevant chunks (user-scoped)
   *   4. build the prompt from rules + context + recent history
   *   5. call the AI provider
   *   6. persist the assistant message WITH its sources (for citations)
   *   7. log token usage (best-effort)
   */
  async sendMessage(userId: string, input: { conversationId?: string; message: string }): Promise<SendMessageResult> {
    const conversation = input.conversationId
      ? await this.conversations.getForUser(input.conversationId, userId)
      : await this.conversations.create(userId, truncate(input.message, 60));

    const userMessage = await this.messages.insert(conversation.id, 'user', input.message);

    const chunks = await this.rag.retrieve(input.message, userId, TOP_K);
    const history = await this.messages.recentByConversation(conversation.id, HISTORY_LIMIT + 1);
    // Drop the just-inserted user message from history (it's the question).
    const priorHistory = history.filter((m) => m.id !== userMessage.id);

    const promptMessages = this.prompt.build(input.message, chunks, priorHistory);
    const completion = await this.ai.chat(promptMessages);

    const sources = ChunksRepository.toSources(chunks);
    const assistantMessage = await this.messages.insert(
      conversation.id,
      'assistant',
      completion.content,
      sources,
    );

    await this.conversations.touch(conversation.id);
    await this.usage.log({
      userId,
      conversationId: conversation.id,
      operation: 'chat',
      model: completion.model,
      usage: completion.usage,
    });

    return { conversationId: conversation.id, userMessage, assistantMessage };
  }
}
