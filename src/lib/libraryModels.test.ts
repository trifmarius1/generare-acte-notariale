import { describe, expect, it } from 'vitest';
import type { OfficeProfile } from '@/domain/types';
import { manualChapters, manualDocument } from '@/data/manual';
import { documentToDocx } from '@/lib/docxExport';
import { detectTemplate } from '@/lib/quality';
import { otherModels } from '@/modules/otherActs';
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
    expect(successionModels.length).toBe(30);
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
    const parent = successionModels.find((item) => item.id === 's11-sot-parinte-certificat')?.build(office);
    expect(parent?.plainText).toContain('(1/2)');
    const spouseOnly = successionModels.find((item) => item.id === 's12-numai-sotul-certificat')?.build(office);
    expect(spouseOnly?.plainText).toContain('(1/1)');
    const unworthy = successionModels.find((item) => item.id === 's13-nedemn-certificat')?.build(office);
    expect(unworthy?.plainText).toContain('Luca Mureșan');
    expect(unworthy?.plainText).toContain('(1/2)');
    const home = successionModels.find((item) => item.id === 's14-locuinta-certificat')?.build(office);
    expect(home?.plainText).toContain('art. 973');
    const twoChildren = successionModels.find((item) => item.id === 's15-sot-doi-copii-certificat')?.build(office);
    expect(twoChildren?.plainText).toContain('(3/8)');
  });

  it('pune după succesiuni celelalte acte și proceduri, fără onorarii inventate', () => {
    expect(otherModels.length).toBe(16);
    expect(new Set(otherModels.map((item) => item.id)).size).toBe(16);
    for (const model of otherModels) {
      const doc = model.build(office);
      expect(doc.plainText, model.id).toContain('PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC');
      expect(doc.plainText, model.id).not.toContain('……');
      expect(doc.plainText, model.id).not.toContain('[●]');
      expect(doc.citations.length, model.id).toBeGreaterThan(0);
    }
    const partaj = otherModels.find((item) => item.id === 'p04-partaj')!.build(office).plainText;
    expect(partaj).toContain('anexa nr. 2 pct. III');
    expect(partaj).toContain('nu calculează onorariul de partaj');
    const ipoteca = otherModels.find((item) => item.id === 'p05-ipoteca')!.build(office).plainText;
    expect(ipoteca).toContain('art. 2377');
    expect(ipoteca).not.toContain('art. 2386 pct. 1 din Codul civil. Ipoteca garantează');
    const societate = otherModels.find((item) => item.id === 'p06-societate')!.build(office).plainText;
    expect(societate).toContain('300,00 lei');
    expect(societate).toContain('fără aport în natură');
    const testament = otherModels.find((item) => item.id === 'p03-revocare-testament')!.build(office).plainText;
    expect(testament).toContain('50,00 lei');
    const divort = otherModels.find((item) => item.id === 'p15-divort')!.build(office).plainText;
    expect(divort).toContain('art. 375');
    expect(divort).toContain('nu au copii minori');
    expect(divort).toContain('30 de zile');
    const apostila = otherModels.find((item) => item.id === 'p16-apostila')!.build(office).plainText;
    expect(apostila).toContain('nu o semnează notarul instrumentator');
    expect(apostila).toContain('Camera');
  });

  it('scrie un fișier Word real pentru un act și pentru o succesiune', async () => {
    const sale = templateById(actModels[0].templateId)!.generate(actModels[0].values, office);
    const succession = successionModels[0].build(office);
    for (const doc of [sale, succession]) {
      const bytes = new Uint8Array(await (await documentToDocx(doc)).arrayBuffer());
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes.byteLength).toBeGreaterThan(2000);
    }
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
