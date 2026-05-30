import type { IChatProvider } from '@repo/shared';
import { loadChatConfig } from '../../../config/ai.config';
import { OpenAICompatibleChatProvider } from '../providers/openai-compatible/openai-compatible-chat.provider';

/**
 * Builds the chat provider from environment config.
 *
 * Today there is one provider family (OpenAI-compatible) that covers OpenAI,
 * Groq, Together, OpenRouter and Ollama via base URL alone. If a genuinely
 * different protocol ever needs supporting (e.g. Anthropic's native API), add
 * a branch here keyed on an env value — the rest of the app, which depends only
 * on IChatProvider, does not change.
 */
export function createChatProvider(): IChatProvider {
  const config = loadChatConfig();
  return new OpenAICompatibleChatProvider(config);
}
