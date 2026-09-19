import express from 'express';
import { pool } from './db.js';
import { validateTitle, validateDueDate } from './validation.js';

export const router = express.Router();

const toDto = (row) => ({
  id: row.id,
  title: row.title,
  dueDate: row.due_date,
  done: row.done,
  createdAt: row.created_at,
});

router.get('/tasks', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE NOT done ORDER BY due_date ASC NULLS LAST, id ASC');
    res.json(rows.map(toDto));
  } catch (err) {
    next(err);
  }
});

router.post('/tasks', async (req, res, next) => {
  try {
    const { title, dueDate } = req.body ?? {};
    const error = validateTitle(title) ?? validateDueDate(dueDate);
    if (error) return res.status(400).json({ error });
    const { rows } = await pool.query('INSERT INTO tasks (title, due_date) VALUES ($1, $2) RETURNING *', [
      title.trim(),
      dueDate || null,
    ]);
    res.status(201).json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:id/done', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    const { rows } = await pool.query('UPDATE tasks SET done = true WHERE id = $1 RETURNING *', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    res.json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});
