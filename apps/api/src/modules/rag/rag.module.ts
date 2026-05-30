import { Module } from '@nestjs/common';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { ChunksRepository } from './chunks.repository';
import { RagService } from './rag.service';

/**
 * AiModule is @Global, so AiService is available to EmbeddingService without
 * importing it here. RagService is the only public surface other modules use.
 */
@Module({
  providers: [ChunkingService, EmbeddingService, ChunksRepository, RagService],
  exports: [RagService],
})
export class RagModule {}
