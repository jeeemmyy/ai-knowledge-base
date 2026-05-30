import { Injectable } from '@nestjs/common';
import { getEncoding, type Tiktoken } from 'js-tiktoken';

export interface ChunkingOptions {
  /** Target tokens per chunk. */
  chunkSize: number;
  /** Token overlap between consecutive chunks. */
  overlap: number;
}

const DEFAULTS: ChunkingOptions = { chunkSize: 512, overlap: 100 };

/**
 * Recursive character splitter with REAL token counting (cl100k_base, the
 * encoding used by text-embedding-3-small). Tries to split on natural
 * boundaries — paragraphs, then lines, then sentences, then words — and only
 * hard-cuts as a last resort, so chunks stay semantically coherent.
 */
@Injectable()
export class ChunkingService {
  private readonly enc: Tiktoken = getEncoding('cl100k_base');
  private static readonly SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

  countTokens(text: string): number {
    return this.enc.encode(text).length;
  }

  chunk(text: string, options: Partial<ChunkingOptions> = {}): string[] {
    const opts = { ...DEFAULTS, ...options };
    const trimmed = text.trim();
    if (!trimmed) return [];

    const pieces = this.split(trimmed, opts.chunkSize, ChunkingService.SEPARATORS);
    return this.mergeWithOverlap(pieces, opts);
  }

  /** Recursively break text into pieces no larger than chunkSize tokens. */
  private split(text: string, chunkSize: number, separators: string[]): string[] {
    if (this.withinTokenLimit(text, chunkSize)) return [text];

    const [sep, ...rest] = separators;
    if (sep === undefined) return [text]; // exhausted separators

    // Hard cut by tokens when no separator remains.
    if (sep === '') return this.hardCut(text, chunkSize);

    const parts = text.split(sep).filter((p) => p.length > 0);
    if (parts.length === 1) return this.split(text, chunkSize, rest);

    const out: string[] = [];
    for (const part of parts) {
      const withSep = part + sep;
      if (!this.withinTokenLimit(withSep, chunkSize)) {
        out.push(...this.split(withSep, chunkSize, rest));
      } else {
        out.push(withSep);
      }
    }
    return out;
  }

  /**
   * Cheap "does this fit in `max` tokens?" check.
   *
   * Encoding a very long whitespace-free run in one call is quadratic in
   * js-tiktoken, so we encode in bounded character windows and stop as soon as
   * the running total exceeds `max`. Boundary over-counting only ever makes us
   * split slightly more — never produce an over-size chunk — so correctness is
   * preserved while the worst case stays linear.
   */
  private withinTokenLimit(text: string, max: number): boolean {
    const charWindow = 1000;
    let total = 0;
    for (let start = 0; start < text.length; start += charWindow) {
      total += this.enc.encode(text.slice(start, start + charWindow)).length;
      if (total > max) return false;
    }
    return total <= max;
  }

  /**
   * Hard cut for pathological inputs (no usable separators).
   *
   * Encoding is done over bounded CHARACTER windows rather than the whole
   * string at once: BPE on a very long whitespace-free run is quadratic, so
   * a single huge `encode()` call can stall. Windowing keeps each encode small
   * and the whole operation linear. Minor token-boundary imprecision at window
   * edges is acceptable for a last-resort fallback that real documents never hit.
   */
  private hardCut(text: string, chunkSize: number): string[] {
    const charWindow = Math.max(chunkSize * 6, 600); // generous chars-per-token budget
    const out: string[] = [];
    for (let start = 0; start < text.length; start += charWindow) {
      const window = text.slice(start, start + charWindow);
      const tokens = this.enc.encode(window);
      for (let i = 0; i < tokens.length; i += chunkSize) {
        out.push(this.enc.decode(tokens.slice(i, i + chunkSize)));
      }
    }
    return out;
  }

  /**
   * Greedily merge small pieces up to chunkSize, carrying `overlap` tokens of
   * tail context into the next chunk to preserve continuity across boundaries.
   */
  private mergeWithOverlap(pieces: string[], opts: ChunkingOptions): string[] {
    const chunks: string[] = [];
    let current = '';

    for (const piece of pieces) {
      const candidate = current + piece;
      if (this.countTokens(candidate) > opts.chunkSize && current) {
        chunks.push(current.trim());
        current = this.tailOverlap(current, opts.overlap) + piece;
      } else {
        current = candidate;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  /** Return the last `overlap` tokens of text, decoded back to a string. */
  private tailOverlap(text: string, overlap: number): string {
    if (overlap <= 0) return '';
    const tokens = this.enc.encode(text);
    if (tokens.length <= overlap) return text;
    return this.enc.decode(tokens.slice(tokens.length - overlap));
  }
}
