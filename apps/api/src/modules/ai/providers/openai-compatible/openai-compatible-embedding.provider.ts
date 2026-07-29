import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { IEmbeddingProvider } from '@repo/shared';
import type { AiEmbeddingConfig } from '../../../../config/ai.config';

/**
 * Embedding provider for any OpenAI-compatible embeddings endpoint.
 * Split from chat because some providers offer chat but not embeddings
 * (and vice-versa), so they are configured and injected independently.
 */
export class OpenAICompatibleEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAICompatibleEmbeddingProvider.name);
  private readonly client: OpenAI;
  public readonly dimensions: number;

  constructor(private readonly config: AiEmbeddingConfig) {
    this.client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });
    this.dimensions = config.dimensions;
  }

  async embed(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    if (inputs.length === 0) return [];

    try {
      // Request the exact dimension. Models like Gemini's gemini-embedding-001
      // default to a larger size (3072) and only emit `dimensions` when asked;
      // OpenAI text-embedding-3-* accept it too. Providers that don't support
      // the param (e.g. fixed-size models) get a plain retry.
      let response;
      try {
        response = await this.client.embeddings.create({
          model: this.config.model,
          input: inputs,
          dimensions: this.dimensions,
        });
      } catch {
        response = await this.client.embeddings.create({
          model: this.config.model,
          input: inputs,
        });
      }

      // Preserve input order; OpenAI returns an `index` per item.
      const sorted = [...response.data].sort((a, b) => a.index - b.index);
      const vectors = sorted.map((d) => d.embedding as number[]);

      // Guard: the produced vector size MUST match what the DB column expects.
      const produced = vectors[0]?.length;
      if (produced && produced !== this.dimensions) {
        throw new Error(
          `Embedding dimension mismatch: provider returned ${produced}, ` +
            `but AI_EMBEDDING_DIMENSIONS=${this.dimensions}. ` +
            `Update the migration's vector(N) and AI_EMBEDDING_DIMENSIONS to match.`,
        );
      }

      return vectors;
    } catch (err) {
      this.logger.error(`Embedding failed (model=${this.config.model})`, err as Error);
      throw err;
    }
  }
}
