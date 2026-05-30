import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatMessage, ChatOptions, ChatResponse, IChatProvider } from '@repo/shared';
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
}
