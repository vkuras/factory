import express from 'express';
import { pool } from './db.js';
import { now } from './clock.js';
import { todayInBerlin, overdueWorkingDays, overdueLabel } from './overdue.js';
import { validateTitle, validateDueDate } from './validation.js';

export const router = express.Router();

const toDto = (row, today) => {
  const overdueDays = row.done ? 0 : overdueWorkingDays(row.due_date, today);
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    done: row.done,
    createdAt: row.created_at,
    overdueDays,
    overdueLabel: overdueLabel(overdueDays),
  };
};

router.get('/tasks', async (req, res, next) => {
  try {
    const { filter } = req.query;
    if (filter !== undefined && filter !== 'overdue') return res.status(400).json({ error: 'Unbekannter Filter.' });
    const today = todayInBerlin(now());
    const { rows } = await pool.query('SELECT * FROM tasks WHERE NOT done ORDER BY due_date ASC NULLS LAST, id ASC');
    let tasks = rows.map((row) => toDto(row, today));
    if (filter === 'overdue') {
      tasks = tasks
        .filter((t) => t.overdueDays > 0)
        .sort((a, b) => b.overdueDays - a.overdueDays || a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
    }
    res.json(tasks);
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
    res.status(201).json(toDto(rows[0], todayInBerlin(now())));
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
    res.json(toDto(rows[0], todayInBerlin(now())));
  } catch (err) {
    next(err);
  }
});
