/**
 * Strongly-typed view of the AI-related environment variables.
 * Read once, validated, then injected. Nothing else in the app touches
 * process.env for AI config.
 */
export interface AiChatConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

export interface AiEmbeddingConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  dimensions: number;
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadChatConfig(env: NodeJS.ProcessEnv = process.env): AiChatConfig {
  return {
    baseURL: required('AI_CHAT_BASE_URL', env.AI_CHAT_BASE_URL),
    apiKey: required('AI_CHAT_API_KEY', env.AI_CHAT_API_KEY),
    model: required('AI_CHAT_MODEL', env.AI_CHAT_MODEL),
  };
}

export function loadEmbeddingConfig(env: NodeJS.ProcessEnv = process.env): AiEmbeddingConfig {
  const dimensions = Number(env.AI_EMBEDDING_DIMENSIONS ?? '1536');
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new Error(`AI_EMBEDDING_DIMENSIONS must be a positive integer, got: ${env.AI_EMBEDDING_DIMENSIONS}`);
  }
  return {
    baseURL: required('AI_EMBEDDING_BASE_URL', env.AI_EMBEDDING_BASE_URL),
    apiKey: required('AI_EMBEDDING_API_KEY', env.AI_EMBEDDING_API_KEY),
    model: required('AI_EMBEDDING_MODEL', env.AI_EMBEDDING_MODEL),
    dimensions,
  };
}
