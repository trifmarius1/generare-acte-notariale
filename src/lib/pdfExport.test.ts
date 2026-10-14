import { describe, expect, it } from 'vitest';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { OfficeProfile } from '@/domain/types';
import { documentToPdf } from '@/lib/pdfExport';
import { actModels } from '@/modules/sampleActs';
import { templateById } from '@/modules/templates';

GlobalWorkerOptions.workerSrc = new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).href;

const office: OfficeProfile = {
  notaryName: 'Ionescu Andrei',
  chamber: 'Camera Notarilor Publici Cluj',
  address: 'Cluj-Napoca, str. Memorandumului nr. 28',
  license: '145/12.03.2019',
  circumscription: 'Circumscripția Tribunalului Cluj',
  vatPayer: false,
};

describe('export PDF', () => {
  it('păstrează bannerul de proiect și diacriticele', async () => {
    const model = actModels[0];
    const template = templateById(model.templateId);
    expect(template).toBeTruthy();
    const blob = await documentToPdf(template!.generate(model.values, office));
    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    expect(text).toContain('PROIECT DE LUCRU');
    expect(text).toContain('VÂNZARE');
    expect(text).toMatch(/[ăâîșțĂÂÎȘȚ]/);
    await pdf.destroy();
  });
});
