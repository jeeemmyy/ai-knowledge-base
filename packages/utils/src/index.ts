/**
 * Small shared helpers used by both web and api.
 * Kept intentionally tiny — no business logic here.
 */

/** Truncate text to a max length, appending an ellipsis if cut. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Type-safe check that a value is a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Build a short, human display title from raw document text. */
export function deriveTitleFromContent(content: string, fallback = 'Untitled'): string {
  const firstLine = content.split('\n').find((l) => l.trim().length > 0);
  return firstLine ? truncate(firstLine.trim(), 80) : fallback;
}
