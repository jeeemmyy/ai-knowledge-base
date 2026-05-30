import { Injectable, Logger } from '@nestjs/common';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { ChunksRepository, type NewChunk, type RetrievedChunk } from './chunks.repository';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly chunks: ChunksRepository,
  ) {}

  /**
   * (Re)index a document: chunk -> embed -> atomic swap.
   *
   * Order matters. Embeddings are created BEFORE any DB write; if the provider
   * call fails, the old chunks remain intact and retrieval keeps working on the
   * previous version. The delete+insert then happens in one transaction (RPC),
   * so a reader never sees a chunk-less document.
   */
  async indexDocument(documentId: string, content: string): Promise<void> {
    const texts = this.chunking.chunk(content);

    if (texts.length === 0) {
      // Empty document: clear chunks (swap with empty set) and return.
      await this.chunks.replaceForDocument(documentId, []);
      return;
    }

    const vectors = await this.embedding.embedChunks(texts); // may throw -> old chunks survive
    const newChunks: NewChunk[] = texts.map((chunkText, i) => ({
      chunkIndex: i,
      chunkText,
      embedding: vectors[i],
    }));

    await this.chunks.replaceForDocument(documentId, newChunks);
    this.logger.log(`Indexed document ${documentId}: ${newChunks.length} chunks`);
  }

  /** Retrieve the top-k most relevant chunks for a question, user-scoped. */
  async retrieve(question: string, userId: string, topK = 5): Promise<RetrievedChunk[]> {
    const queryVector = await this.embedding.embedQuery(question);
    return this.chunks.search(queryVector, userId, topK);
  }
}
