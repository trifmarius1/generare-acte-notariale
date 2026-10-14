import { describe, expect, it } from 'vitest';
import { knowledge } from '@/data/knowledge';
import { matchesKnowledge } from '@/lib/knowledgeSearch';

function ids(query: string): string[] {
  return knowledge.filter((entry) => matchesKnowledge(query, entry)).map((entry) => entry.id);
}

describe('local law notes search', () => {
  it('keeps every note when the box is empty', () => {
    expect(ids('')).toHaveLength(knowledge.length);
    expect(ids('   ')).toHaveLength(knowledge.length);
    expect(ids('...')).toHaveLength(knowledge.length);
  });

  it('finds a note from one word, with or without diacritics', () => {
    expect(ids('ipoteca')).toEqual(['ipoteca-legala']);
    expect(ids('vânzare')).toContain('vanzare');
    expect(ids('vanzare')).toContain('vanzare');
  });

  it('finds words that are not written next to each other', () => {
    expect(ids('legea 36')).toContain('statut');
    expect(ids('cod civil')).toContain('vanzare');
    expect(ids('cod fiscal')).toContain('impozit');
    expect(ids('vanzare imobil')).toContain('vanzare');
  });

  it('finds an article whether it is written with a dot or as a thousand', () => {
    expect(ids('art 1650')).toContain('vanzare');
    expect(ids('art. 1650')).toContain('vanzare');
    expect(ids('articolul 1650')).toContain('vanzare');
    expect(ids('1.650')).toContain('vanzare');
    expect(ids('art 2386')).toEqual(['ipoteca-legala']);
  });

  it('returns nothing when the words are not in the notes', () => {
    expect(ids('qqqq zzzz')).toEqual([]);
  });
});
