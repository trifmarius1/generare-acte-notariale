import { describe, expect, it } from 'vitest';
import { fileKind } from '@/lib/fileKind';

describe('fileKind', () => {
  it('recunoaște textul, Word, PDF, pozele și scanările TIFF', () => {
    expect(fileKind('act.txt', '')).toBe('text');
    expect(fileKind('act.DOCX', '')).toBe('docx');
    expect(fileKind('scan.pdf', 'application/pdf')).toBe('pdf');
    expect(fileKind('poza.JPG', 'image/jpeg')).toBe('image');
    expect(fileKind('poza.png', '')).toBe('image');
    expect(fileKind('poza.webp', '')).toBe('image');
    expect(fileKind('poza.gif', '')).toBe('image');
    expect(fileKind('poza.bmp', '')).toBe('image');
    expect(fileKind('poza.heic', '')).toBe('image');
    expect(fileKind('scan.tiff', 'image/tiff')).toBe('tiff');
    expect(fileKind('scan.tif', '')).toBe('tiff');
    expect(fileKind('arhiva.zip', '')).toBe('unknown');
    expect(fileKind('fara-extensie', 'image/png')).toBe('image');
  });
});
