import type { ActDocument, OfficeProfile } from '@/domain/types';
import { buildDocument } from './document';

const PLACEHOLDER = /\{\{\s*([\p{L}\p{N}_]+)\s*\}\}/gu;

export function placeholderKeys(body: string): string[] {
  const keys = new Set<string>();
  for (const match of body.matchAll(PLACEHOLDER)) keys.add(match[1]);
  return [...keys];
}

export function customDocument(title: string, body: string, values: Record<string, string>, office: OfficeProfile): ActDocument {
  const filled = body.replace(PLACEHOLDER, (_full, key: string) => values[key]?.trim() || '……');
  const paragraphs = filled
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return buildDocument({
    title: title.trim() || 'MODEL PROPRIU',
    kind: 'model-propriu',
    office,
    intro: ['Text întocmit după un model păstrat numai pe acest dispozitiv.'],
    sections: [{ heading: 'Conținut', paragraphs: paragraphs.length ? paragraphs : ['……'] }],
    closing: [
      'Proiect de lucru. Nu este înscris autentic. Temeiurile scrise în model se confruntă cu forma consolidată din ziua actului.',
    ],
    citations: [
      {
        label: 'Model propriu al biroului',
        url: 'https://legislatie.just.ro',
        note: 'Aplicația nu verifică fondul unui model scris de utilizator.',
      },
    ],
  });
}
