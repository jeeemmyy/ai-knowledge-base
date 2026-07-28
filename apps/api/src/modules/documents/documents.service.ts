import { Injectable } from '@nestjs/common';
import type { Document } from '@repo/shared';
import { DocumentsRepository } from './documents.repository';
import { RagService } from '../rag/rag.service';
import { LimitsService } from '../limits/limits.service';
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly repo: DocumentsRepository,
    private readonly rag: RagService,
    private readonly limits: LimitsService,
  ) {}

  list(userId: string): Promise<Document[]> {
    return this.repo.findAllByUser(userId);
  }

  get(id: string, userId: string): Promise<Document> {
    return this.repo.findByIdForUser(id, userId);
  }

  async create(user: AuthenticatedUser, dto: CreateDocumentDto): Promise<Document> {
    // Enforce the free-tier document cap before doing any work.
    await this.limits.assertCanCreateDocument(user);

    const doc = await this.repo.create(user.id, {
      title: dto.title,
      content: dto.content,
      tags: dto.tags ?? [],
    });
    try {
      // Chunk + embed + store. Atomic chunk swap handled inside RagService.
      await this.rag.indexDocument(doc.id, doc.content);
    } catch (err) {
      // Indexing failed (e.g. the embedding provider is down or out of quota).
      // Roll back the document row so create is all-or-nothing: otherwise we
      // leave an unsearchable orphan that returns 500 to the client yet still
      // appears on reload — which leads users to retry and create duplicates.
      await this.repo.delete(doc.id, user.id).catch(() => undefined);
      throw err;
    }
    // Count only successfully-indexed documents against the lifetime cap.
    await this.limits.incrementDocuments(user.id);
    return doc;
  }

  async update(id: string, userId: string, dto: UpdateDocumentDto): Promise<Document> {
    const doc = await this.repo.update(id, userId, {
      title: dto.title,
      content: dto.content,
      tags: dto.tags,
    });
    // Only re-embed when content actually changed.
    if (dto.content !== undefined) {
      await this.rag.indexDocument(doc.id, doc.content);
    }
    return doc;
  }

  delete(id: string, userId: string): Promise<void> {
    // document_chunks rows cascade-delete at the DB level.
    return this.repo.delete(id, userId);
  }
}
