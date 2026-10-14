import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { legalAgent } from './src/server/legalPlugin';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import type { Connect } from 'vite';

const CORE_FILE = /^tesseract-core(?:-relaxedsimd|-simd)?-lstm\.wasm(?:\.js)?$/;

/** `/` la lucru local. Pe GitHub Pages, calea depozitului, cu / la final. */
function siteBase(): string {
  const raw = process.env.PAGES_BASE?.trim();
  if (!raw || raw === '/') return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

const site = siteBase();

function localTesseract(): Plugin {
  const workerFile = path.resolve('node_modules/tesseract.js/dist/worker.min.js');
  const coreDir = path.resolve('node_modules/tesseract.js-core');

  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '').split('?')[0] ?? '';
    if (url === '/tesseract/worker.min.js') {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      fs.createReadStream(workerFile).pipe(res);
      return;
    }
    if (!url.startsWith('/tesseract-core/')) {
      next();
      return;
    }
    let name = url.slice('/tesseract-core/'.length);
    try {
      name = decodeURIComponent(name);
    } catch {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (!CORE_FILE.test(name)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    const file = path.join(coreDir, name);
    if (!file.startsWith(coreDir) || !fs.existsSync(file)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  };

  return {
    name: 'local-tesseract',
    configureServer(server) {
      server.middlewares.use(serve);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve);
    },
    closeBundle() {
      const outWorker = path.resolve('dist/tesseract');
      const outCore = path.resolve('dist/tesseract-core');
      fs.mkdirSync(outWorker, { recursive: true });
      fs.mkdirSync(outCore, { recursive: true });
      fs.copyFileSync(workerFile, path.join(outWorker, 'worker.min.js'));
      for (const name of fs.readdirSync(coreDir)) {
        if (CORE_FILE.test(name)) fs.copyFileSync(path.join(coreDir, name), path.join(outCore, name));
      }
    },
  };
}

export default defineConfig({
  base: site,
  plugins: [
    localTesseract(),
    legalAgent(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Acte notariale — asistență locală',
        short_name: 'Acte notariale',
        description:
          'Redactare, verificare și calcule pentru acte notariale românești. Procesare exclusiv pe dispozitivul notarului.',
        lang: 'ro',
        display: 'standalone',
        background_color: '#e7f7f4',
        theme_color: '#042f38',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,gz}'],
        globIgnores: ['**/tesseract/**', '**/tesseract-core/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${site}index.html`,
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
