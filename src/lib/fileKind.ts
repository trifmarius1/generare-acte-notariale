export type FileKind = 'text' | 'docx' | 'pdf' | 'image' | 'tiff' | 'unknown';

const RASTER = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'heif']);

export function fileKind(name: string, mime = ''): FileKind {
  const lower = name.toLowerCase();
  const extension = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  if (extension === 'txt' || mime.startsWith('text/plain')) return 'text';
  if (extension === 'docx') return 'docx';
  if (extension === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (extension === 'tif' || extension === 'tiff' || mime === 'image/tiff') return 'tiff';
  if (RASTER.has(extension) || mime.startsWith('image/')) return 'image';
  return 'unknown';
}
