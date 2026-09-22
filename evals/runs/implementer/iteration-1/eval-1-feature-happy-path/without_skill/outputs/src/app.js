import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { validateTitle } from './validation.js';
import { today, validateDueDate, dueState } from './dates.js';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  const payload = contentType.startsWith('application/json')
    ? JSON.stringify(body)
    : body;
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

export function createApp({ store, publicDir }) {
  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path === '/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (path === '/api/tasks' && req.method === 'GET') {
      const reference = today(req.headers['x-today']);
      const tasks = store.list().map((task) => ({
        ...task,
        dueState: dueState(task.dueDate ?? null, reference),
      }));
      return send(res, 200, { tasks });
    }

    if (path === '/api/tasks' && req.method === 'POST') {
      const body = await readJson(req);
      if (body === null) return send(res, 400, { error: 'Invalid JSON body.' });
      const { title, error: titleError } = validateTitle(body.title);
      if (titleError) return send(res, 400, { error: titleError });
      const { dueDate, error: dueDateError } = validateDueDate(body.dueDate);
      if (dueDateError) return send(res, 400, { error: dueDateError });
      return send(res, 201, store.add({ title, dueDate }));
    }

    const match = path.match(/^\/api\/tasks\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (req.method === 'PATCH') {
        const body = await readJson(req);
        if (body === null) return send(res, 400, { error: 'Invalid JSON body.' });
        const fields = {};
        if ('done' in body) {
          if (typeof body.done !== 'boolean') {
            return send(res, 400, { error: 'The field "done" must be true or false.' });
          }
          fields.done = body.done;
        }
        if ('dueDate' in body) {
          const { dueDate, error } = validateDueDate(body.dueDate);
          if (error) return send(res, 400, { error });
          fields.dueDate = dueDate;
        }
        if (Object.keys(fields).length === 0) {
          return send(res, 400, { error: 'Nothing to update.' });
        }
        const task = store.update(id, fields);
        if (!task) return send(res, 404, { error: 'This task does not exist.' });
        return send(res, 200, task);
      }
      if (req.method === 'DELETE') {
        if (!store.remove(id)) {
          return send(res, 404, { error: 'This task does not exist.' });
        }
        res.writeHead(204);
        return res.end();
      }
    }

    if (req.method === 'GET') {
      const file = path === '/' ? 'index.html' : normalize(path).replace(/^(\.\.[/\\])+/, '').slice(1);
      const full = join(publicDir, file);
      if (full.startsWith(publicDir) && existsSync(full)) {
        return send(res, 200, readFileSync(full, 'utf8'), CONTENT_TYPES[extname(full)] ?? 'text/plain; charset=utf-8');
      }
    }

    return send(res, 404, { error: 'Not found.' });
  };
}
