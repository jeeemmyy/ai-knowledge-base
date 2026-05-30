import type { IEmbeddingProvider } from '@repo/shared';
import { loadEmbeddingConfig } from '../../../config/ai.config';
import { OpenAICompatibleEmbeddingProvider } from '../providers/openai-compatible/openai-compatible-embedding.provider';

export function createEmbeddingProvider(): IEmbeddingProvider {
  const config = loadEmbeddingConfig();
  return new OpenAICompatibleEmbeddingProvider(config);
}
