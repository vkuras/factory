import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask, deleteTask } from '../helpers.js';

// The acceptance criteria pin "today" with X-Today (ADR-0002), so the
// boundary of R4 does not depend on the day the suite happens to run.
const TODAY = { 'X-Today': '2026-09-19' };

async function tasksOn(day) {
  const { body } = await api('GET', '/api/tasks', undefined, { 'X-Today': day });
  return body.tasks;
}

test('S5.1 creates a task with a day and shows it in the list', async () => {
  await withTask({ title: 'Ship the report', dueDate: '2026-09-25' }, async (task) => {
    assert.equal(task.dueDate, '2026-09-25');
    const tasks = await tasksOn('2026-09-19');
    const found = tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, '2026-09-25');
  });
});

test('S5.2 creates a task without a day exactly as before this feature', async () => {
  await withTask({ title: 'Water the plants' }, async (task) => {
    assert.equal(task.dueDate, null);
    const tasks = await tasksOn('2026-09-19');
    const found = tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S5.3 sets a day on a task that had none', async () => {
  await withTask({ title: 'Call the plumber' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-09-30' });
    assert.equal(status, 200);
    assert.equal(body.dueDate, '2026-09-30');
    const tasks = await tasksOn('2026-09-19');
    assert.equal(tasks.find((t) => t.id === task.id).dueDate, '2026-09-30');
  });
});

test('S5.4 rejects a day that is not a real date on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad date', dueDate: '2026-02-30' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects a day in the wrong form on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad format', dueDate: '19-09-2026' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects an invalid day on update and leaves the task unchanged', async () => {
  await withTask({ title: 'Keep me intact', dueDate: '2026-09-20' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: 'not a date' });
    assert.equal(status, 400);
    assert.match(body.error, /date/i);
    const tasks = await tasksOn('2026-09-19');
    assert.equal(tasks.find((t) => t.id === task.id).dueDate, '2026-09-20');
  });
});

test('S5.5 allows a day that already passed', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Overdue on arrival', dueDate: '2020-01-01' });
  assert.equal(status, 201);
  assert.equal(body.dueDate, '2020-01-01');
  await deleteTask(body.id);
});

test('S6.1 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'Late task', dueDate: '2026-09-18' }, async (task) => {
    const tasks = await tasksOn('2026-09-19');
    assert.equal(tasks.find((t) => t.id === task.id).dueState, 'overdue');
  });
});

test('S6.2 marks a task whose day is today as due-today, not overdue', async () => {
  await withTask({ title: 'Due right now', dueDate: '2026-09-19' }, async (task) => {
    const tasks = await tasksOn('2026-09-19');
    assert.equal(tasks.find((t) => t.id === task.id).dueState, 'due-today');
  });
});

test('S6.3 marks a task whose day is after today with neither overdue nor due-today', async () => {
  await withTask({ title: 'Plenty of time', dueDate: '2026-09-20' }, async (task) => {
    const tasks = await tasksOn('2026-09-19');
    assert.equal(tasks.find((t) => t.id === task.id).dueState, 'upcoming');
  });
});

test('S6.4 a task without a day shows no marking', async () => {
  await withTask({ title: 'Someday' }, async (task) => {
    const tasks = await tasksOn('2026-09-19');
    const found = tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S6.5 orders open tasks by day, soonest first, no day last', async () => {
  const noDay = await api('POST', '/api/tasks', { title: 'z-no-day' }).then((r) => r.body);
  const later = await api('POST', '/api/tasks', { title: 'z-later', dueDate: '2026-09-25' }).then((r) => r.body);
  const soonest = await api('POST', '/api/tasks', { title: 'z-soonest', dueDate: '2026-09-19' }).then((r) => r.body);
  try {
    const tasks = await tasksOn('2026-09-19');
    const ids = [soonest.id, later.id, noDay.id];
    const order = tasks.filter((t) => ids.includes(t.id)).map((t) => t.id);
    assert.deepEqual(order, ids);
  } finally {
    await deleteTask(noDay.id);
    await deleteTask(later.id);
    await deleteTask(soonest.id);
  }
});

test('R4 boundary example from the requirements holds', async () => {
  // With today being 2026-09-19: 2026-09-18 is overdue, 2026-09-19 is due
  // today, 2026-09-20 is neither.
  await withTask({ title: 'boundary -1', dueDate: '2026-09-18' }, async (t1) => {
    await withTask({ title: 'boundary 0', dueDate: '2026-09-19' }, async (t2) => {
      await withTask({ title: 'boundary +1', dueDate: '2026-09-20' }, async (t3) => {
        const tasks = await tasksOn('2026-09-19');
        assert.equal(tasks.find((t) => t.id === t1.id).dueState, 'overdue');
        assert.equal(tasks.find((t) => t.id === t2.id).dueState, 'due-today');
        assert.equal(tasks.find((t) => t.id === t3.id).dueState, 'upcoming');
      });
    });
  });
});
