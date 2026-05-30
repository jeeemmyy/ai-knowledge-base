import type { IEmbeddingProvider } from '@repo/shared';

export type { IEmbeddingProvider } from '@repo/shared';

/** Injection token for the configured embedding provider. */
export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
export type EmbeddingProviderToken = IEmbeddingProvider;
