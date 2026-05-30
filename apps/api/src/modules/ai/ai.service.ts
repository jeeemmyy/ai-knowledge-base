import { Inject, Injectable } from '@nestjs/common';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  IChatProvider,
  IEmbeddingProvider,
} from '@repo/shared';
import { CHAT_PROVIDER } from './interfaces/chat-provider.interface';
import { EMBEDDING_PROVIDER } from './interfaces/embedding-provider.interface';

/**
 * Thin facade the rest of the backend depends on. RagModule and ChatModule
 * inject AiService, never a concrete provider, so the provider swap is total.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject(CHAT_PROVIDER) private readonly chatProvider: IChatProvider,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddingProvider: IEmbeddingProvider,
  ) {}

  get embeddingDimensions(): number {
    return this.embeddingProvider.dimensions;
  }

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return this.chatProvider.chat(messages, options);
  }

  embed(input: string | string[]): Promise<number[][]> {
    return this.embeddingProvider.embed(input);
  }
}
