import { createWorker, type Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

function localWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('ron', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract-core',
      langPath: '/tessdata',
      gzip: true,
      workerBlobURL: false,
    }).catch((error: unknown) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/** Citire optică în browser. Imaginea nu este trimisă la un server. */
export async function recognizeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await localWorker();
  const result = await worker.recognize(canvas);
  return result.data.text ?? '';
}
