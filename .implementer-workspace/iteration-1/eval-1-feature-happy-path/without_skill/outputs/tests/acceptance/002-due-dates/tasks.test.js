import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, listOn, withTask } from '../helpers.js';

const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';

test('S5.1 creates a task with a due date and shows it in the list', async () => {
  await withTask({ title: 'Ship the release', dueDate: TOMORROW }, async (task) => {
    assert.equal(task.dueDate, TOMORROW);
    const { body } = await listOn(TODAY);
    const found = body.tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, TOMORROW);
  });
});

test('S5.2 creates a task without a due date exactly as before this feature', async () => {
  await withTask({ title: 'No due date here' }, async (task) => {
    assert.equal(task.dueDate, null);
    const { body } = await listOn(TODAY);
    const found = body.tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S5.3 sets a due date on a task that had none', async () => {
  await withTask({ title: 'Add a date later' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: TOMORROW });
    assert.equal(status, 200);
    assert.equal(body.dueDate, TOMORROW);
    const { body: list } = await listOn(TODAY);
    assert.equal(list.tasks.find((t) => t.id === task.id).dueDate, TOMORROW);
  });
});

test('S5.4 rejects a due date that is not a real date, on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad date', dueDate: '2026-02-30' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects a due date not in the form YYYY-MM-DD, on create', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Bad format', dueDate: '19-09-2026' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects an invalid due date on update, and the task is unchanged', async () => {
  await withTask({ title: 'Keep me valid', dueDate: TOMORROW }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: 'not-a-date' });
    assert.equal(status, 400);
    assert.match(body.error, /date/i);
    const { body: list } = await listOn(TODAY);
    assert.equal(list.tasks.find((t) => t.id === task.id).dueDate, TOMORROW);
  });
});

test('S5.5 accepts a due date that already passed', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Already late', dueDate: YESTERDAY });
  assert.equal(status, 201);
  assert.equal(body.dueDate, YESTERDAY);
  await api('DELETE', `/api/tasks/${body.id}`);
});

test('S6.1 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'Late task', dueDate: YESTERDAY }, async (task) => {
    const { body } = await listOn(TODAY);
    assert.equal(body.tasks.find((t) => t.id === task.id).dueState, 'overdue');
  });
});

test('S6.2 marks a task whose day is today as due-today, not overdue', async () => {
  await withTask({ title: 'Due right now', dueDate: TODAY }, async (task) => {
    const { body } = await listOn(TODAY);
    assert.equal(body.tasks.find((t) => t.id === task.id).dueState, 'due-today');
  });
});

test('S6.3 shows a future day without an overdue or due-today marking', async () => {
  await withTask({ title: 'Future task', dueDate: TOMORROW }, async (task) => {
    const { body } = await listOn(TODAY);
    assert.equal(body.tasks.find((t) => t.id === task.id).dueState, 'upcoming');
  });
});

test('S6.4 shows no day and no marking for a task without one', async () => {
  await withTask({ title: 'No day at all' }, async (task) => {
    const { body } = await listOn(TODAY);
    const found = body.tasks.find((t) => t.id === task.id);
    assert.equal(found.dueDate, null);
    assert.equal(found.dueState, 'none');
  });
});

test('S6.5 orders open tasks by day, soonest first, no-day tasks last', async () => {
  await withTask({ title: 'no day' }, async () => {
    await withTask({ title: 'far', dueDate: '2026-12-01' }, async () => {
      await withTask({ title: 'near', dueDate: TOMORROW }, async () => {
        const { body } = await listOn(TODAY);
        const titles = body.tasks.map((t) => t.title);
        const near = titles.indexOf('near');
        const far = titles.indexOf('far');
        const noDay = titles.indexOf('no day');
        assert.ok(near < far, `expected 'near' before 'far': ${titles.join(', ')}`);
        assert.ok(far < noDay, `expected 'far' before 'no day': ${titles.join(', ')}`);
      });
    });
  });
});

test('R6 an existing 001-style task (no dueDate field sent) stays valid', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Plain old task' });
  assert.equal(status, 201);
  assert.equal(body.done, false);
  await api('DELETE', `/api/tasks/${body.id}`);
});
