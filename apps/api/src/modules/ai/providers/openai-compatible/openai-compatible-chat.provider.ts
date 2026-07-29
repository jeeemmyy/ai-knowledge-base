import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  IChatProvider,
} from '@repo/shared';
import type { AiChatConfig } from '../../../../config/ai.config';

/**
 * Chat provider for ANY OpenAI-compatible endpoint (OpenAI, Groq, Together,
 * OpenRouter, Ollama, ...). The only thing that differs between them is
 * baseURL / apiKey / model — all injected via config. No provider-specific
 * branching lives here, which is the whole point of the abstraction.
 */
export class OpenAICompatibleChatProvider implements IChatProvider {
  private readonly logger = new Logger(OpenAICompatibleChatProvider.name);
  private readonly client: OpenAI;

  constructor(private readonly config: AiChatConfig) {
    this.client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      // Auto-retry transient rate limits (429) with exponential backoff — free
      // tiers throttle bursts, and most clear within a few seconds.
      maxRetries: 4,
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model ?? this.config.model;
    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
      });

      const choice = completion.choices[0];
      const content = choice?.message?.content ?? '';

      return {
        content,
        model: completion.model ?? model,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err) {
      this.logger.error(`Chat completion failed (model=${model})`, err as Error);
      throw err;
    }
  }

  async *stream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatStreamChunk> {
    const model = options?.model ?? this.config.model;
    const base = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens,
      stream: true as const,
    };
    try {
      // `stream_options` gives token usage on the final chunk, but not every
      // OpenAI-compatible provider accepts it — fall back to a plain stream.
      let completion;
      try {
        completion = await this.client.chat.completions.create({
          ...base,
          stream_options: { include_usage: true },
        });
      } catch {
        completion = await this.client.chat.completions.create(base);
      }

      for await (const part of completion) {
        const delta = part.choices[0]?.delta?.content ?? '';
        // The terminal chunk (with include_usage) has empty choices and usage.
        if (part.usage) {
          yield {
            delta,
            model: part.model ?? model,
            usage: {
              promptTokens: part.usage.prompt_tokens,
              completionTokens: part.usage.completion_tokens,
              totalTokens: part.usage.total_tokens,
            },
          };
        } else if (delta) {
          yield { delta };
        }
      }
    } catch (err) {
      this.logger.error(`Chat stream failed (model=${model})`, err as Error);
      throw err;
    }
  }
}
