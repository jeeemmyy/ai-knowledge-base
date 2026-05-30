import { Injectable } from '@nestjs/common';
import type { ChatMessage, Message } from '@repo/shared';
import type { RetrievedChunk } from '../rag/chunks.repository';

const SYSTEM_PROMPT = `You are a knowledge base assistant. Answer the user's question using ONLY the provided context from their documents.

Rules:
- Base your answer strictly on the context below. Do not use outside knowledge.
- If the context does not contain the answer, say clearly that you could not find relevant information in their documents. Do NOT invent an answer or imply it came from their documents when it did not.
- Be concise and cite naturally (e.g. "According to <document title>...").`;

@Injectable()
export class PromptBuilderService {
  /**
   * Assemble the full message list: system rules, retrieved context, recent
   * chat history, then the new question. When no context was retrieved, the
   * system prompt's no-context rule keeps the answer grounded.
   */
  build(question: string, chunks: RetrievedChunk[], history: Message[]): ChatMessage[] {
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    const context =
      chunks.length > 0
        ? chunks
            .map((c, i) => `[${i + 1}] From "${c.documentTitle}":\n${c.chunkText}`)
            .join('\n\n')
        : 'NO RELEVANT DOCUMENTS WERE FOUND.';

    messages.push({ role: 'system', content: `Context from the user's documents:\n\n${context}` });

    // Recent history for conversational continuity (excludes the new question).
    for (const m of history) {
      if (m.role === 'user' || m.role === 'assistant') {
        messages.push({ role: m.role, content: m.content });
      }
    }

    messages.push({ role: 'user', content: question });
    return messages;
  }
}
