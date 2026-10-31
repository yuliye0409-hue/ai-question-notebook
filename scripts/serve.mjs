import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
if (!existsSync(root)) { console.error('dist 不存在，请先运行 npm run build'); process.exit(1); }
const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safePath = resolve(root, `.${requestPath === '/' ? '/index.html' : requestPath}`);
  if (!safePath.startsWith(root) || !existsSync(safePath) || !statSync(safePath).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[extname(safePath)] || 'application/octet-stream' });
  createReadStream(safePath).pipe(res);
});
server.listen(4173, '127.0.0.1', () => { console.log('问而知预览：http://127.0.0.1:4173'); });
