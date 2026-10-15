import { describe, expect, it } from 'vitest';
import { codeManuals, codesCheckedOn, repealedManual } from '@/data/codes';
import { dictionaries } from '@/i18n';
import { matchesText } from '@/lib/knowledgeSearch';

const staleIds = ['223635', '171768', '171282', '184359', '113393'];

const portalUrls: Record<string, string> = {
  cpc: 'https://legislatie.just.ro/Public/DetaliiDocument/140271',
  cpp: 'https://legislatie.just.ro/Public/DetaliiDocument/120611',
  civil: 'https://legislatie.just.ro/Public/DetaliiDocument/109884',
  penal: 'https://legislatie.just.ro/Public/DetaliiDocument/109855',
  fiscal: 'https://legislatie.just.ro/Public/DetaliiDocument/192984',
  'proc-fiscal': 'https://legislatie.just.ro/Public/DetaliiDocument/306111',
  munca: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/303235',
  administrativ: 'https://legislatie.just.ro/Public/DetaliiDocument/314108',
};

function parts(code: (typeof codeManuals)[number]): string[] {
  return [
    code.title.ro,
    code.title.en,
    code.title.hu,
    code.summary.ro,
    code.summary.en,
    code.summary.hu,
    code.secondLabel.ro,
    code.secondLabel.en,
    code.secondLabel.hu,
    code.citation,
    code.body,
  ];
}

describe('official code manuals', () => {
  it('lists the eight codes that were opened, in a stable order', () => {
    expect(codeManuals.map((code) => code.id)).toEqual([
      'cpc',
      'cpp',
      'civil',
      'penal',
      'fiscal',
      'proc-fiscal',
      'munca',
      'administrativ',
    ]);
    expect(new Set(codeManuals.map((code) => code.id)).size).toBe(8);
    expect(codesCheckedOn).toBe('15 octombrie 2026');
  });

  it('points each card at the consolidation that was read, and at a different official page', () => {
    for (const code of codeManuals) {
      expect(code.portalUrl).toBe(portalUrls[code.id]);
      expect(code.secondUrl.startsWith('https://')).toBe(true);
      expect(code.portalUrl.startsWith('https://')).toBe(true);
      expect(code.secondUrl).not.toBe(code.portalUrl);
      expect(code.title.en.length).toBeGreaterThan(0);
      expect(code.title.hu.length).toBeGreaterThan(0);
      expect(code.body.length).toBeLessThan(1600);
      expect(code.body).toMatch(/Monitorul Oficial/);
    }
  });

  it('does not link a consolidation that was found to be years behind', () => {
    const blob = JSON.stringify({ codeManuals, repealedManual });
    for (const id of staleIds) {
      expect(blob).not.toContain(id);
    }
    expect(repealedManual.body).toMatch(/Monitorul Oficial/);
    expect(repealedManual.body).toContain('1864');
    expect(repealedManual.body).toContain('1969');
    expect(repealedManual.body).toContain('92/2003');
    expect(repealedManual.body).toContain('571/2003');
    expect(repealedManual.body).toContain('10/1972');
  });

  it('keeps the disagreements that the two official pages did not settle', () => {
    const byId = Object.fromEntries(codeManuals.map((code) => [code.id, code]));
    expect(byId.cpc.body).toContain('216/2025');
    expect(byId.cpc.body).toContain('1151');
    expect(byId.cpc.body).toContain('2026');
    expect(byId.cpp.body).toContain('94/2026');
    expect(byId.cpp.body).toContain('482');
    expect(byId.civil.body).toContain('57/2026');
    expect(byId.civil.body).toContain('1864');
    expect(byId.penal.body).toContain('01/04/2018');
    expect(byId.penal.body).toContain('158');
    expect(byId.penal.body).not.toMatch(/nr\.\s*767/);
    expect(byId.fiscal.body).toContain('170');
    expect(byId.fiscal.body).toContain('571/2003');
    expect(byId['proc-fiscal'].body).toContain('170/2026');
    expect(byId['proc-fiscal'].body).toContain('nu spun același lucru');
    expect(byId.munca.body).toContain('27 aprilie 2026');
    expect(byId.munca.body).toContain('10/1972');
    expect(byId.administrativ.body).toContain('186');
    expect(byId.administrativ.body).toContain('767');
    expect(byId.administrativ.body).not.toMatch(/767 din/);
  });

  it('finds the criminal-procedure code from the words on the card', () => {
    const hits = codeManuals.filter((code) => matchesText('procedura penala', parts(code)));
    expect(hits.map((code) => code.id)).toEqual(['cpp']);
    expect(matchesText('', parts(codeManuals[0]))).toBe(true);
  });

  it('has the same codes labels in Romanian, English and Hungarian', () => {
    for (const lang of ['ro', 'en', 'hu'] as const) {
      expect(dictionaries[lang].codesTitle.length).toBeGreaterThan(0);
      expect(dictionaries[lang].codesLead).toContain('14');
      expect(dictionaries[lang].codesHonest.length).toBeGreaterThan(40);
      expect(dictionaries[lang].codesChecked).toContain('15');
      expect(dictionaries[lang].codesOpen.length).toBeGreaterThan(0);
    }
    expect(dictionaries.ro.codesTitle).toBe('Coduri în vigoare');
    expect(dictionaries.en.codesTitle).toBe('Codes in force');
    expect(dictionaries.hu.codesTitle).toBe('Hatályos törvénykönyvek');
  });
});
