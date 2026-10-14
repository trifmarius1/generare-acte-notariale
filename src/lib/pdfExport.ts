import * as fontkitModule from '@pdf-lib/fontkit';
import { PDFDocument, type PDFFont, rgb } from 'pdf-lib';
import type { ActDocument } from '@/domain/types';

const loadedFontkit = fontkitModule as unknown as {
  default?: { create: (buffer: Uint8Array, postscriptName?: string) => unknown };
  create?: (buffer: Uint8Array, postscriptName?: string) => unknown;
};
const fontkit = loadedFontkit.default?.create ? loadedFontkit.default : loadedFontkit;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const BODY = 11;
const TITLE = 14;
const LEADING = 15;

async function readFont(fileName: string): Promise<Uint8Array> {
  const url = new URL(`../assets/fonts/${fileName}`, import.meta.url);
  if (url.protocol === 'file:') {
    const specifier = ['node', 'fs/promises'].join(':');
    const fs = (await import(/* @vite-ignore */ specifier)) as { readFile: (path: URL) => Promise<Uint8Array> };
    return new Uint8Array(await fs.readFile(url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('font');
  return new Uint8Array(await response.arrayBuffer());
}

const GLYPH_FALLBACK: Record<string, string> = {
  '●': '*',
  '—': '-',
  '–': '-',
  '…': '...',
  '„': '"',
  '”': '"',
  '«': '"',
  '»': '"',
  '’': "'",
  '‘': "'",
};

function hasGlyph(font: PDFFont, ch: string): boolean {
  try {
    font.widthOfTextAtSize(ch, BODY);
    return true;
  } catch {
    return false;
  }
}

function printable(font: PDFFont, text: string): string {
  let out = '';
  for (const ch of text) {
    if (ch === '\n' || ch === '\t') {
      out += ' ';
      continue;
    }
    if (hasGlyph(font, ch)) {
      out += ch;
      continue;
    }
    const fallback = GLYPH_FALLBACK[ch] ?? '?';
    for (const piece of fallback) out += hasGlyph(font, piece) ? piece : '?';
  }
  return out.replace(/[ ]{2,}/g, ' ').trim();
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = printable(font, text).split(' ').filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** PDF cu diacritice, pentru arhivă locală. Editarea se face din DOCX. Font: Liberation Serif, SIL Open Font License. */
export async function documentToPdf(act: ActDocument): Promise<Blob> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit as Parameters<PDFDocument['registerFontkit']>[0]);
  pdf.setTitle(act.title);
  pdf.setLanguage('ro-RO');
  const regular = await pdf.embedFont(await readFont('LiberationSerif-Regular.ttf'), { subset: true });
  const bold = await pdf.embedFont(await readFont('LiberationSerif-Bold.ttf'), { subset: true });
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const nextPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const drawLines = (lines: string[], font: PDFFont, size: number, center = false, gap = 8) => {
    for (const line of lines) {
      if (y < MARGIN + LEADING) nextPage();
      const width = font.widthOfTextAtSize(line, size);
      const x = center ? Math.max(MARGIN, (PAGE_WIDTH - width) / 2) : MARGIN;
      page.drawText(line, { x, y, size, font, color: rgb(0.07, 0.12, 0.16) });
      y -= LEADING;
    }
    y -= gap;
  };

  const block = (text: string, font: PDFFont, size: number, center = false) => {
    const lines = wrap(font, text, size, maxWidth);
    if (lines.length) drawLines(lines, font, size, center);
  };

  for (const [index, line] of act.banner.filter((item) => item.trim()).entries()) {
    block(line, index === 0 || line.startsWith('PROIECT') ? bold : regular, index === 0 ? 12 : BODY, true);
  }
  block(act.title, bold, TITLE, true);
  for (const section of act.sections) {
    if (section.heading.trim()) block(section.heading, bold, 12);
    for (const paragraph of section.paragraphs) block(paragraph, regular, BODY);
  }
  for (const line of act.closing) block(line, regular, BODY);
  block('Temeiuri reținute în proiect', bold, 12);
  for (const citation of act.citations) block(`${citation.label}. ${citation.note}`, regular, BODY);

  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: 'application/pdf' });
}
