import { describe, expect, it } from 'vitest';
import { emptyOffice } from '@/domain/types';
import { customDocument, placeholderKeys } from './customAct';
import { templates } from './templates';

describe('modele de acte', () => {
  it('generează un proiect, nu un înscris autentic, pentru fiecare model', () => {
    for (const template of templates) {
      const doc = template.generate({}, emptyOffice());
      expect(doc.plainText).toContain('PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC');
      expect(doc.citations.length).toBeGreaterThan(0);
      expect(doc.title.length).toBeGreaterThan(3);
    }
  });

  it('înlocuiește câmpurile unui model propriu și lasă golurile vizibile', () => {
    expect(placeholderKeys('Eu, {{nume}}, domiciliat în {{oras}}.')).toEqual(['nume', 'oras']);
    const doc = customDocument('Declarație', 'Eu, {{nume}}, din {{oras}}.', { nume: 'Ionescu Ana' }, emptyOffice());
    expect(doc.plainText).toContain('Ionescu Ana');
    expect(doc.plainText).toContain('……');
    expect(doc.plainText).toContain('PROIECT DE LUCRU');
  });
});
