import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { fileKind } from '@/lib/fileKind';

GlobalWorkerOptions.workerSrc = workerUrl;

export { fileKind } from '@/lib/fileKind';

export interface ReadProgress {
  page: number;
  total: number;
}

const PAGE_CAP = 8;

export async function extractDocumentText(
  file: File,
  options?: { onProgress?: (progress: ReadProgress) => void },
): Promise<string> {
  const kind = fileKind(file.name, file.type);
  if (kind === 'text') return file.text();
  if (kind === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  if (kind === 'pdf') return extractPdf(await file.arrayBuffer(), options?.onProgress);
  if (kind === 'tiff') return readTiff(await file.arrayBuffer(), options?.onProgress);
  if (kind === 'image') return readRaster(file, options?.onProgress);
  throw new Error('unsupported');
}

async function extractPdf(data: ArrayBuffer, onProgress?: (progress: ReadProgress) => void): Promise<string> {
  const pdf = await getDocument({ data: data.slice(0) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (line) pages.push(line);
  }
  const text = pages.join('\n\n');
  const letters = text.replace(/\s/g, '').length;
  if (letters >= 80 || typeof document === 'undefined') return text;
  return ocrPdf(data, onProgress);
}

async function ocrPdf(data: ArrayBuffer, onProgress?: (progress: ReadProgress) => void): Promise<string> {
  const pdf = await getDocument({ data: data.slice(0) }).promise;
  const total = Math.min(pdf.numPages, PAGE_CAP);
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    onProgress?.({ page: pageNumber, total });
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('unsupported');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    pages.push(await recognize(canvas));
  }
  return joinPages(pages, pdf.numPages > PAGE_CAP);
}

async function readRaster(file: File, onProgress?: (progress: ReadProgress) => void): Promise<string> {
  if (typeof document === 'undefined') throw new Error('unsupported');
  onProgress?.({ page: 1, total: 1 });
  const canvas = await canvasFromBlob(file);
  const text = (await recognize(canvas)).trim();
  if (text.length < 8) throw new Error('empty-scan');
  return text;
}

async function readTiff(data: ArrayBuffer, onProgress?: (progress: ReadProgress) => void): Promise<string> {
  if (typeof document === 'undefined') throw new Error('unsupported');
  const UTIF = (await import('utif')).default;
  const decoded = UTIF.decode(data);
  if (!decoded.length) throw new Error('empty-scan');
  const total = Math.min(decoded.length, PAGE_CAP);
  const pages: string[] = [];
  for (let index = 0; index < total; index += 1) {
    onProgress?.({ page: index + 1, total });
    const page = decoded[index];
    if (!page) continue;
    UTIF.decodeImage(data, page);
    const rgba = UTIF.toRGBA8(page);
    const canvas = document.createElement('canvas');
    canvas.width = page.width;
    canvas.height = page.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('unsupported');
    const image = context.createImageData(page.width, page.height);
    image.data.set(rgba);
    context.putImageData(image, 0, 0);
    pages.push(await recognize(scaleCanvas(canvas)));
  }
  const text = joinPages(pages, decoded.length > PAGE_CAP).trim();
  if (text.replace(/\s/g, '').length < 8) throw new Error('empty-scan');
  return text;
}

async function recognize(canvas: HTMLCanvasElement): Promise<string> {
  const { recognizeCanvas } = await import('./ocr');
  return recognizeCanvas(canvas);
}

function joinPages(pages: string[], truncated: boolean): string {
  const body = pages.map((page) => page.trim()).filter(Boolean).join('\n\n');
  if (!truncated) return body;
  return `${body}\n\n[Citirea automată s-a oprit după ${PAGE_CAP} pagini. Restul scanării se verifică din original.]`;
}

function canvasFromBlob(file: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      if (!context || canvas.width < 2 || canvas.height < 2) {
        URL.revokeObjectURL(url);
        reject(new Error('unsupported'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      resolve(scaleCanvas(canvas));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unsupported'));
    };
    image.src = url;
  });
}

function scaleCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const longest = Math.max(source.width, source.height);
  const target = longest < 1000 ? 1600 : longest > 2200 ? 2200 : longest;
  if (target === longest) return source;
  const scale = target / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}
