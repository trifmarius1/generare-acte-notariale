import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { ActDocument } from '@/domain/types';

function run(text: string, options?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text,
    bold: options?.bold,
    font: 'Times New Roman',
    size: options?.size ?? 22,
  });
}

function paragraph(text: string, options?: { center?: boolean; bold?: boolean; heading?: boolean }): Paragraph {
  return new Paragraph({
    alignment: options?.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    heading: options?.heading ? HeadingLevel.HEADING_2 : undefined,
    spacing: { after: 160, line: 360 },
    children: [run(text, { bold: options?.bold || options?.heading, size: options?.heading ? 24 : 22 })],
  });
}

export async function documentToDocx(act: ActDocument): Promise<Blob> {
  const children: Paragraph[] = [
    ...act.banner.map((line, index) =>
      paragraph(line, { center: true, bold: index === 0 || line.startsWith('PROIECT') }),
    ),
    paragraph(act.title, { center: true, bold: true, heading: true }),
    ...act.sections.flatMap((section) => [
      ...(section.heading ? [paragraph(section.heading, { bold: true })] : []),
      ...section.paragraphs.filter(Boolean).map((text) => paragraph(text)),
    ]),
    ...act.closing.map((text) => paragraph(text)),
    paragraph('Temeiuri reținute în proiect', { bold: true }),
    ...act.citations.map((citation) => paragraph(`${citation.label}. ${citation.note}`)),
  ];
  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } }, children }],
  });
  return Packer.toBlob(doc);
}
