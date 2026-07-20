import { Injectable, Logger } from '@nestjs/common';
import type { ChatStreamEvent, Conversation, Message, SendMessageResult } from '@repo/shared';
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
  private readonly logger = new Logger(ChatService.name);

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

  /**
   * Streaming variant of {@link sendMessage}. Same RAG flow, but the assistant
   * answer is yielded token-by-token; the message is persisted (with sources
   * and usage) once the model finishes. Emits ChatStreamEvents for the SSE
   * endpoint. A provider failure is surfaced as an `error` event rather than
   * throwing, so the client always gets a clean end to the stream.
   */
  async *streamMessage(
    userId: string,
    input: { conversationId?: string; message: string },
  ): AsyncGenerator<ChatStreamEvent> {
    const conversation = input.conversationId
      ? await this.conversations.getForUser(input.conversationId, userId)
      : await this.conversations.create(userId, truncate(input.message, 60));

    const userMessage = await this.messages.insert(conversation.id, 'user', input.message);
    yield { type: 'meta', conversationId: conversation.id, userMessage };

    let content = '';
    let model = '';
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
    let assistantMessage: Message;

    try {
      // Everything that touches the AI provider (embedding for retrieval, then
      // the chat stream) lives here so any provider failure ends the stream
      // with a friendly `error` event instead of an abrupt disconnect.
      const chunks = await this.rag.retrieve(input.message, userId, TOP_K);
      const history = await this.messages.recentByConversation(conversation.id, HISTORY_LIMIT + 1);
      const priorHistory = history.filter((m) => m.id !== userMessage.id);
      const promptMessages = this.prompt.build(input.message, chunks, priorHistory);

      for await (const chunk of this.ai.stream(promptMessages)) {
        if (chunk.delta) {
          content += chunk.delta;
          yield { type: 'delta', text: chunk.delta };
        }
        if (chunk.model) model = chunk.model;
        if (chunk.usage) usage = chunk.usage;
      }

      assistantMessage = await this.messages.insert(
        conversation.id,
        'assistant',
        content,
        ChunksRepository.toSources(chunks),
      );
    } catch (err) {
      this.logger.error('Chat stream failed', err as Error);
      yield { type: 'error', message: 'The AI provider is currently unavailable. Please try again.' };
      return;
    }

    await this.conversations.touch(conversation.id);
    await this.usage.log({
      userId,
      conversationId: conversation.id,
      operation: 'chat',
      model,
      usage,
    });

    yield { type: 'done', assistantMessage };
  }
}
