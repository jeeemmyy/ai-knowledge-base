/**
 * Provider-agnostic AI contract.
 *
 * These types are the single source of truth for how the rest of the app
 * talks to *any* AI provider. Nothing here mentions OpenAI, Groq, Ollama,
 * etc. Concrete providers (in apps/api) implement these interfaces; swapping
 * a provider is a config change, never an application-code change.
 *
 * Chat and embeddings are split deliberately: some providers support one but
 * not the other (e.g. a chat-only endpoint), so they are configured and
 * injected independently.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  /** Override the configured model for a single call. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  /** Present when the provider reports usage; used by usage_logs. */
  usage?: TokenUsage;
}

/**
 * One incremental piece of a streamed chat completion. `delta` is the new text
 * (empty on the terminal chunk); `usage`/`model` appear on the final chunk when
 * the provider reports them.
 */
export interface ChatStreamChunk {
  delta: string;
  usage?: TokenUsage;
  model?: string;
}

/**
 * Chat provider contract. Implemented per provider family.
 * Any OpenAI-compatible endpoint is one implementation.
 */
export interface IChatProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  /** Stream the completion token-by-token. Yields text deltas, then usage. */
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk>;
}

/**
 * Embedding provider contract. Returns one vector per input string.
 * The vector length MUST match AI_EMBEDDING_DIMENSIONS and the DB vector(N).
 */
export interface IEmbeddingProvider {
  embed(input: string | string[]): Promise<number[][]>;
  /** The dimensionality this provider is configured to produce. */
  readonly dimensions: number;
}
