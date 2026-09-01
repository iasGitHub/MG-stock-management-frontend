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
    let data;
    try {
      data = await readFile(file);
    } catch {
      if (extname(pathname) !== '') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      data = await readFile(resolve(ROOT, 'index.html'));
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}).listen(PORT, () => {
  console.log(`static server listening on ${PORT} (root: ${ROOT})`);
});