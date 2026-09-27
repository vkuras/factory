import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { TaskStore } from './store.js';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const dataDir = process.env.DATA_DIR ?? join(here, '..', 'data');

const store = new TaskStore(dataDir);
const app = createApp({ store, publicDir: join(here, '..', 'public') });

createServer(app).listen(port, () => {
  console.log(`Taskboard listening on port ${port}, data in ${dataDir}`);
});
