import { Injectable } from '@nestjs/common';
import type { Document } from '@repo/shared';
import { DocumentsRepository } from './documents.repository';
import { RagService } from '../rag/rag.service';
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly repo: DocumentsRepository,
    private readonly rag: RagService,
  ) {}

  list(userId: string): Promise<Document[]> {
    return this.repo.findAllByUser(userId);
  }

  get(id: string, userId: string): Promise<Document> {
    return this.repo.findByIdForUser(id, userId);
  }

  async create(userId: string, dto: CreateDocumentDto): Promise<Document> {
    const doc = await this.repo.create(userId, {
      title: dto.title,
      content: dto.content,
      tags: dto.tags ?? [],
    });
    // Chunk + embed + store. Atomic swap handled inside RagService.
    await this.rag.indexDocument(doc.id, doc.content);
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
