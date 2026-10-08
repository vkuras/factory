// Serves the video stage under /__stage/ and proxies everything else to the
// running Taskboard, so the stage page and the embedded app share one origin.
import { createServer, request } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const STAGE_DIR = process.argv[2];
const PORT = Number(process.argv[3] ?? 8212);
const APP_PORT = Number(process.argv[4] ?? 8112);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/__stage/')) {
    const rel = normalize(url.pathname.slice('/__stage/'.length)).replace(/^(\.\.[/\\])+/, '');
    const file = join(STAGE_DIR, rel || 'index.html');
    if (file.startsWith(STAGE_DIR) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      return res.end(readFileSync(file));
    }
    res.writeHead(404);
    return res.end('not found');
  }
  const upstream = request(
    { host: '127.0.0.1', port: APP_PORT, method: req.method, path: req.url, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    res.writeHead(502);
    res.end(String(err));
  });
  req.pipe(upstream);
}).listen(PORT, '127.0.0.1', () => console.log(`stage on ${PORT}, app on ${APP_PORT}`));
