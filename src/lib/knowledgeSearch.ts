import type { KnowledgeEntry } from '@/data/knowledge';

/** Lowercase, without diacritics, with article labels and thousand-dots flattened. */
export function foldSearch(value: string): string {
  return value
    .toLocaleLowerCase('ro')
    .replace(/[ăâ]/g, 'a')
    .replace(/î/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/\barticolul\b|\barticol\b/g, 'art')
    .replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesText(query: string, parts: readonly string[]): boolean {
  const words = foldSearch(query).split(' ').filter((word) => word.length > 0);
  if (words.length === 0) return true;
  const haystack = foldSearch(parts.join(' '));
  return words.every((word) => haystack.includes(word));
}

export function matchesKnowledge(query: string, entry: KnowledgeEntry): boolean {
  return matchesText(query, [
    entry.title.ro,
    entry.title.en,
    entry.title.hu,
    entry.summary.ro,
    entry.summary.en,
    entry.summary.hu,
    entry.citation,
    entry.body,
  ]);
}
