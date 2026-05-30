import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class EmbeddingService {
  constructor(private readonly ai: AiService) {}

  /** Embed an ordered array of chunk texts, preserving order. */
  embedChunks(texts: string[]): Promise<number[][]> {
    return this.ai.embed(texts);
  }

  /** Embed a single query string. */
  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.ai.embed(text);
    return vector;
  }
}
