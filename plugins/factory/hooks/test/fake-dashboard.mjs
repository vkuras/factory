// A stand-in for the dashboard, for the reporter's shell tests. It records every request as one
// JSON line (path, decoded meta, headers, body) and answers with FAKE_STATUS (default 204).
// FAKE_HANG=1 accepts the connection and never answers, to prove the reporter's own timeouts.
//   node fake-dashboard.mjs <port-file> <requests-file>
import { createServer } from 'node:http';
import { appendFileSync, writeFileSync } from 'node:fs';

const [portFile, requestsFile] = process.argv.slice(2);
const status = Number(process.env.FAKE_STATUS ?? 204);
const hang = process.env.FAKE_HANG === '1';

const server = createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    let meta = null;
    try {
      meta = JSON.parse(Buffer.from(String(req.headers['x-factory-meta'] ?? ''), 'base64').toString('utf8'));
    } catch {
      meta = null;
    }
    appendFileSync(
      requestsFile,
      JSON.stringify({
        method: req.method,
        path: req.url,
        meta,
        authorization: req.headers['authorization'] ?? null,
        contentType: req.headers['content-type'] ?? null,
        body,
      }) + '\n',
    );
    if (hang) return;
    res.statusCode = status;
    res.end();
  });
});
server.listen(0, '127.0.0.1', () => {
  writeFileSync(`${portFile}.pid`, String(process.pid));
  writeFileSync(portFile, String(server.address().port));
});
