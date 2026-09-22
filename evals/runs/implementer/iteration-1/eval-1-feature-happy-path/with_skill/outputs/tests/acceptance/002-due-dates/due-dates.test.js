import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask } from '../helpers.js';

// ADR-0002: the acceptance suite pins "today" with X-Today so the R4
// boundary does not depend on the day the suite happens to run.
const TODAY = '2026-09-19';
const TODAY_HEADERS = { 'X-Today': TODAY };

async function listTasks() {
  const { body } = await api('GET', '/api/tasks', undefined, TODAY_HEADERS);
  return body.tasks;
}

function findTask(tasks, id) {
  return tasks.find((t) => t.id === id);
}

test('S5.1 creates a task with a day and shows it in the list', async () => {
  await withTask({ title: 'Send the proposal', dueDate: '2026-09-25' }, async (task) => {
    assert.equal(task.dueDate, '2026-09-25');
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueDate, '2026-09-25');
  });
});

test('S5.2 creates a task without a day, unchanged from before this feature', async () => {
  await withTask({ title: 'Water the plants' }, async (task) => {
    assert.equal(task.dueDate, null);
    const tasks = await listTasks();
    const found = findTask(tasks, task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S5.3 sets a day on a task that had none', async () => {
  await withTask({ title: 'Call the plumber' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-09-30' });
    assert.equal(status, 200);
    assert.equal(body.dueDate, '2026-09-30');
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueDate, '2026-09-30');
  });
});

test('S5.4 rejects a day that is not a real date, on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad date', dueDate: '2026-02-30' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects a day that is not in the form YYYY-MM-DD, on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad format', dueDate: '30/02/2026' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects an invalid day when changing an existing task, and leaves it unchanged', async () => {
  await withTask({ title: 'Keep me', dueDate: '2026-09-20' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: 'not-a-date' });
    assert.equal(status, 400);
    assert.match(body.error, /date/i);
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueDate, '2026-09-20');
  });
});

test('S5.5 allows a day that has already passed', async () => {
  await withTask({ title: 'Overdue on purpose', dueDate: '2020-01-01' }, async (task) => {
    assert.equal(task.dueDate, '2020-01-01');
  });
});

test('S6.1 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'Late task', dueDate: '2026-09-18' }, async (task) => {
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueState, 'overdue');
  });
});

test('S6.2 marks a task whose day is today as due today, not overdue', async () => {
  await withTask({ title: 'Due right now', dueDate: TODAY }, async (task) => {
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueState, 'due-today');
  });
});

test('S6.3 marks a task whose day is after today as upcoming, no overdue/due-today', async () => {
  await withTask({ title: 'Plenty of time', dueDate: '2026-09-20' }, async (task) => {
    const tasks = await listTasks();
    assert.equal(findTask(tasks, task.id).dueState, 'upcoming');
  });
});

test('S6.4 a task without a day shows no day and no marking', async () => {
  await withTask({ title: 'Someday' }, async (task) => {
    const tasks = await listTasks();
    const found = findTask(tasks, task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S6.5 orders open tasks by day, soonest first, no-day tasks last', async () => {
  await withTask({ title: 'no day' }, async () => {
    await withTask({ title: 'later day', dueDate: '2026-09-30' }, async () => {
      await withTask({ title: 'soonest day', dueDate: '2026-09-20' }, async () => {
        const tasks = await listTasks();
        const titles = tasks
          .filter((t) => ['no day', 'later day', 'soonest day'].includes(t.title))
          .map((t) => t.title);
        assert.deepEqual(titles, ['soonest day', 'later day', 'no day']);
      });
    });
  });
});

test('R6 a task added before this feature (no dueDate field) still works', async () => {
  // Simulated by omitting dueDate entirely, which is how a pre-002 record
  // reads once loaded: the API must not require or choke on the field.
  const { status, body } = await api('POST', '/api/tasks', { title: 'Plain old task' });
  assert.equal(status, 201);
  assert.equal(body.dueDate, null);
  await api('DELETE', `/api/tasks/${body.id}`);
});
