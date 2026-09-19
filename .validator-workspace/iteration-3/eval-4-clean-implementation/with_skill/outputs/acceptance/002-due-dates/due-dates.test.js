// Black-box acceptance tests for 002 – Due dates and overdue tasks.
// They talk to the running stack over HTTP only. "Today" is pinned with the
// X-Today header (design ADR-0002) so the results do not depend on the day the
// suite runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createTask, deleteTask, listOn, withTask } from '../helpers.js';

const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';

function find(tasks, id) {
  const task = tasks.find((t) => t.id === id);
  assert.ok(task, `task ${id} is not in the list`);
  return task;
}

test('S5.1 creates a task with a day and shows the day in the list', async () => {
  await withTask({ title: 'Pay the invoice', dueDate: '2026-10-01' }, async (task) => {
    assert.equal(task.dueDate, '2026-10-01');
    const listed = find(await listOn(TODAY), task.id);
    assert.equal(listed.dueDate, '2026-10-01');
  });
});

test('S5.2 creates a task without a day', async () => {
  await withTask({ title: 'No day at all' }, async (task) => {
    const listed = find(await listOn(TODAY), task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.title, 'No day at all');
    assert.equal(listed.done, false);
  });
});

test('S5.2 creates a task with an explicitly empty day', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'Explicit null', dueDate: null });
  assert.equal(status, 201, `explicit null was rejected: ${status}`);
  assert.equal(body.dueDate ?? null, null);
  await deleteTask(body.id);
});

test('S5.3 sets a day on a task that has none', async () => {
  await withTask({ title: 'Gets a day later' }, async (task) => {
    const { status } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-11-05' });
    assert.equal(status, 200);
    assert.equal(find(await listOn(TODAY), task.id).dueDate, '2026-11-05');
  });
});

test('S5.3 changes and clears a day again', async () => {
  await withTask({ title: 'Changes its day', dueDate: '2026-11-05' }, async (task) => {
    await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-11-06' });
    assert.equal(find(await listOn(TODAY), task.id).dueDate, '2026-11-06');
    const cleared = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: null });
    assert.equal(cleared.status, 200);
    assert.equal(find(await listOn(TODAY), task.id).dueDate ?? null, null);
  });
});

for (const bad of ['2026-02-30', '2026-13-01', '2026-09-31', '19.09.2026', '2026-9-1', '09/19/2026', 'tomorrow', '2026-09-19T10:00:00Z']) {
  test(`S5.4 rejects the day ${bad} when creating a task`, async () => {
    const before = (await listOn(TODAY)).length;
    const { status, body } = await api('POST', '/api/tasks', { title: `bad day ${bad}`, dueDate: bad });
    assert.equal(status, 400, `expected 400 for ${bad}, got ${status}`);
    assert.match(String(body?.error ?? ''), /date|day/i);
    assert.equal((await listOn(TODAY)).length, before, 'a task was created despite the invalid day');
  });
}

test('S5.4 rejects an invalid day when changing a task and leaves it unchanged', async () => {
  await withTask({ title: 'Keeps its day', dueDate: '2026-10-01' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-02-30' });
    assert.equal(status, 400);
    assert.match(String(body?.error ?? ''), /date|day/i);
    assert.equal(find(await listOn(TODAY), task.id).dueDate, '2026-10-01');
  });
});

test('R5 accepts a leap day that exists and rejects one that does not', async () => {
  const good = await api('POST', '/api/tasks', { title: 'leap day', dueDate: '2024-02-29' });
  assert.equal(good.status, 201);
  await deleteTask(good.body.id);
  const bad = await api('POST', '/api/tasks', { title: 'no leap day', dueDate: '2026-02-29' });
  assert.equal(bad.status, 400);
});

test('S5.5 accepts a day that already passed', async () => {
  await withTask({ title: 'Already late', dueDate: '2026-01-02' }, async (task) => {
    assert.equal(task.dueDate, '2026-01-02');
    assert.equal(find(await listOn(TODAY), task.id).dueDate, '2026-01-02');
  });
});

test('S6.1 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'Late one', dueDate: YESTERDAY }, async (task) => {
    assert.equal(find(await listOn(TODAY), task.id).dueState, 'overdue');
  });
});

test('S6.2 marks a task due today as due today and not as overdue', async () => {
  await withTask({ title: 'Today one', dueDate: TODAY }, async (task) => {
    const listed = find(await listOn(TODAY), task.id);
    assert.equal(listed.dueState, 'due-today');
    assert.notEqual(listed.dueState, 'overdue');
  });
});

test('S6.3 marks a task due after today as neither overdue nor due today', async () => {
  await withTask({ title: 'Future one', dueDate: TOMORROW }, async (task) => {
    const listed = find(await listOn(TODAY), task.id);
    assert.equal(listed.dueState, 'upcoming');
    assert.equal(listed.dueDate, TOMORROW);
  });
});

test('S6.4 gives a task without a day no day and no marking', async () => {
  await withTask({ title: 'Undated one' }, async (task) => {
    const listed = find(await listOn(TODAY), task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.dueState, 'none');
  });
});

test('R4 boundary: yesterday, today and tomorrow relative to a pinned today', async () => {
  const late = await createTask({ title: 'R4 late', dueDate: '2026-03-14' });
  const now = await createTask({ title: 'R4 today', dueDate: '2026-03-15' });
  const soon = await createTask({ title: 'R4 soon', dueDate: '2026-03-16' });
  try {
    const tasks = await listOn('2026-03-15');
    assert.equal(find(tasks, late.id).dueState, 'overdue');
    assert.equal(find(tasks, now.id).dueState, 'due-today');
    assert.equal(find(tasks, soon.id).dueState, 'upcoming');
  } finally {
    await deleteTask(late.id);
    await deleteTask(now.id);
    await deleteTask(soon.id);
  }
});

test('S6.5 orders open tasks by day, the soonest first, undated last', async () => {
  const undated = await createTask({ title: 'S6.5 undated' });
  const far = await createTask({ title: 'S6.5 far', dueDate: '2026-12-01' });
  const near = await createTask({ title: 'S6.5 near', dueDate: '2026-09-21' });
  const past = await createTask({ title: 'S6.5 past', dueDate: '2026-01-05' });
  try {
    const ids = (await listOn(TODAY))
      .filter((t) => [undated.id, far.id, near.id, past.id].includes(t.id))
      .map((t) => t.id);
    assert.deepEqual(ids, [past.id, near.id, far.id, undated.id]);
  } finally {
    for (const t of [undated, far, near, past]) await deleteTask(t.id);
  }
});

test('S6.5 with 001 S3.2: done tasks stay below open ones', async () => {
  const openUndated = await createTask({ title: 'S6.5 open undated' });
  const doneSoon = await createTask({ title: 'S6.5 done soon', dueDate: '2026-01-01' });
  try {
    await api('PATCH', `/api/tasks/${doneSoon.id}`, { done: true });
    const tasks = await listOn(TODAY);
    const openIndex = tasks.findIndex((t) => t.id === openUndated.id);
    const doneIndex = tasks.findIndex((t) => t.id === doneSoon.id);
    assert.ok(openIndex >= 0 && doneIndex >= 0);
    assert.ok(openIndex < doneIndex, 'a done task with an early day must still be below the open ones');
  } finally {
    await deleteTask(openUndated.id);
    await deleteTask(doneSoon.id);
  }
});

test('R6 a task created without a day keeps working: done, changed and deleted', async () => {
  const task = await createTask({ title: 'R6 legacy-shaped task' });
  const done = await api('PATCH', `/api/tasks/${task.id}`, { done: true });
  assert.equal(done.status, 200);
  assert.equal(find(await listOn(TODAY), task.id).dueState, 'none');
  const removed = await api('DELETE', `/api/tasks/${task.id}`);
  assert.ok(removed.status === 200 || removed.status === 204, `delete returned ${removed.status}`);
});

test('Out of scope: a recurrence field is not accepted as a feature', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'OOS recurring', repeat: 'weekly' });
  if (status === 201) {
    assert.equal(body.repeat, undefined, 'the product stores a recurrence rule');
    assert.equal(body.recurrence, undefined, 'the product stores a recurrence rule');
    await deleteTask(body.id);
  } else {
    assert.equal(status, 400);
  }
});

test('Out of scope: a time of day is not accepted on a due date', async () => {
  const { status } = await api('POST', '/api/tasks', { title: 'OOS time', dueDate: '2026-09-19 14:30' });
  assert.equal(status, 400);
});
