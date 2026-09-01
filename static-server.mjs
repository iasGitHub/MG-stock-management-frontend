import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'dist', 'stock-management-frontend', 'browser');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') {
      pathname = '/index.html';
    }
    const file = resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const ext = extname(file).toLowerCase();
    let data;
    let isSpaFallback = false;
    try {
      data = await readFile(file);
    } catch {
      if (ext !== '') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      data = await readFile(resolve(ROOT, 'index.html'));
      isSpaFallback = true;
    }
    const headers = { 'Content-Type': isSpaFallback ? MIME['.html'] : MIME[ext] || 'application/octet-stream' };
    if (ext === '.html' || pathname === '/env.js') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (ext === '' || isSpaFallback) {
      headers['Cache-Control'] = 'no-cache';
    } else {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    res.writeHead(200, headers);
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}).listen(PORT, () => {
  console.log(`static server listening on ${PORT} (root: ${ROOT})`);
});