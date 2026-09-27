// Tiny static server for the video page (fonts and scripts need http, not file://).
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.json': 'application/json' };
export function serve(root = process.cwd(), port = 0) {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      const f = existsSync(p) && statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
      if (!f.startsWith(root) || !existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      createReadStream(f).pipe(rsp);
    }).listen(port, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await serve(process.cwd(), +(process.argv[2] || 4173));
  console.log('serving', url);
}
