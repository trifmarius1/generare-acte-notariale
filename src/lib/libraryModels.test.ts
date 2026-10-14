import { describe, expect, it } from 'vitest';
import type { OfficeProfile } from '@/domain/types';
import { manualChapters, manualDocument } from '@/data/manual';
import { detectTemplate } from '@/lib/quality';
import { actModels, successionModels } from '@/modules/sampleActs';
import { templateById, templates } from '@/modules/templates';

const office: OfficeProfile = {
  notaryName: 'Ionescu Andrei',
  chamber: 'Camera Notarilor Publici Cluj',
  address: 'Cluj-Napoca, str. Memorandumului nr. 28',
  license: '145/12.03.2019',
  circumscription: 'Circumscripția Tribunalului Cluj',
  vatPayer: false,
};

describe('modele gata generate', () => {
  it('acoperă actele și succesiunile, fără câmpuri goale când biroul este complet', () => {
    expect(actModels.length).toBe(20);
    expect(successionModels.length).toBe(20);
    for (const model of actModels) {
      const template = templateById(model.templateId);
      expect(template, model.id).toBeTruthy();
      const doc = template!.generate(model.values, office);
      expect(doc.plainText, model.id).toContain('PROIECT DE LUCRU');
      expect(doc.plainText, model.id).not.toContain('……');
      expect(doc.plainText, model.id).not.toContain('[●]');
      const found = detectTemplate(doc.plainText, templates);
      expect(found?.template.id, model.id).toBe(model.templateId);
    }
    for (const model of successionModels) {
      const doc = model.build(office);
      expect(doc.plainText, model.id).toContain('PROIECT DE LUCRU');
      expect(doc.plainText, model.id).not.toContain('……');
      expect(doc.plainText, model.id).not.toContain('[●]');
    }
    const spouse = successionModels.find((item) => item.id === 's01-sot-copil-certificat')?.build(office);
    expect(spouse?.plainText).toContain('(1/4)');
    expect(spouse?.plainText).toContain('(3/4)');
    const late = successionModels.find((item) => item.id === 's10-fara-scutire-170-certificat')?.build(office);
    expect(late?.plainText).toContain('Impozit 1% asupra activului net imobiliar');
    const vacant = successionModels.find((item) => item.id === 's07-vacanta-certificat')?.build(office);
    expect(vacant?.plainText).toContain('Nu a fost găsit niciun moștenitor');
  });
});

describe('manualul notarului', () => {
  it('are capitole de la competență până la limite și păstrează regulile din 14 octombrie 2026', () => {
    expect(manualChapters.length).toBeGreaterThanOrEqual(16);
    const text = manualChapters
      .map((chapter) => `${chapter.title}\n${chapter.paragraphs.join('\n')}\n${chapter.citations.map((item) => item.label).join('\n')}`)
      .join('\n');
    expect(text).toContain('art. 15');
    expect(text).toContain('art. 1244');
    expect(text).toContain('3%');
    expect(text).toContain('1%');
    expect(text).toContain('30 septembrie 2026');
    expect(text).toContain('21%');
    expect(text).toContain('anexa nr. 2 pct. XIV');
    const doc = manualDocument(office);
    expect(doc.plainText).toContain('PROIECT DE LUCRU');
    expect(doc.plainText).toContain('MANUAL DE LUCRU PENTRU ACTELE NOTARIALE');
    expect(doc.sections.length).toBeGreaterThan(manualChapters.length);
  });
});
