import express from 'express';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { router } from './tasks.js';

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db-unavailable' });
  }
});

app.use('/api', router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Fehler.' });
});

await migrate(pool);
app.listen(3000, () => console.log('api listening on 3000'));
