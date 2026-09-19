import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createTask, deleteTask, withTask } from '../helpers.js';

// Every state is checked against a pinned day (ADR-0002, header X-Today), so
// the result does not depend on the day the suite runs.
const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';
const PINNED = { 'X-Today': TODAY };

async function listPinned() {
  const { status, body } = await api('GET', '/api/tasks', undefined, PINNED);
  assert.equal(status, 200);
  return body.tasks;
}

function find(tasks, id) {
  const task = tasks.find((t) => t.id === id);
  assert.ok(task, `task ${id} is missing from the list`);
  return task;
}

test('S5.1 creates a task with a day and shows the day in the list', async () => {
  await withTask({ title: 'Pay the invoice', dueDate: TOMORROW }, async (task) => {
    assert.equal(task.dueDate, TOMORROW);
    assert.equal(find(await listPinned(), task.id).dueDate, TOMORROW);
  });
});

test('S5.2 creates a task without a day, exactly as before this feature', async () => {
  await withTask({ title: 'No day at all' }, async (task) => {
    assert.ok(task.dueDate === null || task.dueDate === undefined);
    assert.equal(task.done, false);
    const listed = find(await listPinned(), task.id);
    assert.ok(!listed.dueDate);
    assert.equal(listed.dueState, 'none');
  });
});

test('S5.3 sets a day on a task that had none', async () => {
  await withTask({ title: 'Gets a day later' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: TOMORROW });
    assert.equal(status, 200);
    assert.equal(body.dueDate, TOMORROW);
    assert.equal(find(await listPinned(), task.id).dueDate, TOMORROW);
  });
});

test('S5.4 rejects a day that is not a real date, with a message about the date', async () => {
  for (const bad of ['2026-02-30', '2026-13-01', '2026-09-31']) {
    const { status, body } = await api('POST', '/api/tasks', { title: 'bad day', dueDate: bad });
    assert.equal(status, 400, `${bad} should be rejected`);
    assert.match(body.error, /date/i);
  }
});

test('S5.4 rejects a day that is not in the form 2026-09-19', async () => {
  for (const bad of ['19.09.2026', '2026/09/19', 'tomorrow', '2026-9-1', '2026-09-19T10:00:00Z']) {
    const { status, body } = await api('POST', '/api/tasks', { title: 'bad form', dueDate: bad });
    assert.equal(status, 400, `${bad} should be rejected`);
    assert.match(body.error, /date/i);
  }
});

test('S5.4 does not change a task when the new day is invalid', async () => {
  await withTask({ title: 'Keeps its day', dueDate: TOMORROW }, async (task) => {
    const { status } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-02-30' });
    assert.equal(status, 400);
    assert.equal(find(await listPinned(), task.id).dueDate, TOMORROW);
  });
});

test('S5.5 accepts a day that already passed', async () => {
  await withTask({ title: 'Already late', dueDate: '2026-01-02' }, async (task) => {
    assert.equal(task.dueDate, '2026-01-02');
    assert.equal(find(await listPinned(), task.id).dueState, 'overdue');
  });
});

test('S6.1 / R4 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'Was due yesterday', dueDate: YESTERDAY }, async (task) => {
    assert.equal(find(await listPinned(), task.id).dueState, 'overdue');
  });
});

test('S6.2 / R4 marks a task due today as due today and not overdue', async () => {
  await withTask({ title: 'Due today', dueDate: TODAY }, async (task) => {
    const listed = find(await listPinned(), task.id);
    assert.equal(listed.dueState, 'due-today');
    assert.notEqual(listed.dueState, 'overdue');
  });
});

test('S6.3 / R4 leaves a task due after today unmarked', async () => {
  await withTask({ title: 'Due tomorrow', dueDate: TOMORROW }, async (task) => {
    const listed = find(await listPinned(), task.id);
    assert.equal(listed.dueState, 'upcoming');
    assert.equal(listed.dueDate, TOMORROW);
  });
});

test('S6.4 shows no day and no marking for a task without a day', async () => {
  await withTask({ title: 'Undated' }, async (task) => {
    const listed = find(await listPinned(), task.id);
    assert.ok(!listed.dueDate);
    assert.equal(listed.dueState, 'none');
  });
});

test('S6.5 orders tasks by day, soonest first, undated last', async () => {
  const undated = await createTask({ title: 'order: undated' });
  const late = await createTask({ title: 'order: 2026-09-20', dueDate: TOMORROW });
  const soon = await createTask({ title: 'order: 2026-09-18', dueDate: YESTERDAY });
  try {
    const mine = (await listPinned())
      .filter((t) => t.title.startsWith('order: '))
      .map((t) => t.id);
    assert.deepEqual(mine, [soon.id, late.id, undated.id]);
  } finally {
    for (const t of [undated, late, soon]) await deleteTask(t.id);
  }
});

test('S6.5 + 001 S3.2 keeps done tasks below open ones whatever their day', async () => {
  const openLate = await createTask({ title: 'group: open, far away', dueDate: '2026-12-31' });
  const doneSoon = await createTask({ title: 'group: done, very soon', dueDate: YESTERDAY });
  try {
    await api('PATCH', `/api/tasks/${doneSoon.id}`, { done: true });
    const mine = (await listPinned())
      .filter((t) => t.title.startsWith('group: '))
      .map((t) => t.id);
    assert.deepEqual(mine, [openLate.id, doneSoon.id]);
  } finally {
    for (const t of [openLate, doneSoon]) await deleteTask(t.id);
  }
});

test('R6 a task from before this feature stays valid and works without a day', async () => {
  // A task created without the field at all, then toggled and deleted like any
  // other: the optional field must not break the flows of 001.
  const task = await createTask({ title: 'Legacy shaped task' });
  const patched = await api('PATCH', `/api/tasks/${task.id}`, { done: true });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.done, true);
  assert.ok(!patched.body.dueDate);
  const removed = await api('DELETE', `/api/tasks/${task.id}`);
  assert.equal(removed.status, 204);
});

test('R6 a day can be removed again', async () => {
  await withTask({ title: 'Loses its day', dueDate: TOMORROW }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: null });
    assert.equal(status, 200);
    assert.ok(!body.dueDate);
    assert.equal(find(await listPinned(), task.id).dueState, 'none');
  });
});

test('R4 without a pinned day the server decides, and the boundary still holds', async () => {
  // No X-Today header: the states must come from the server's own day
  // (Europe/Berlin), not from the client.
  const serverToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const before = new Date(`${serverToday}T00:00:00Z`);
  before.setUTCDate(before.getUTCDate() - 1);
  const yesterday = before.toISOString().slice(0, 10);

  const dueToday = await createTask({ title: 'live: today', dueDate: serverToday });
  const late = await createTask({ title: 'live: yesterday', dueDate: yesterday });
  try {
    const { body } = await api('GET', '/api/tasks');
    assert.equal(body.tasks.find((t) => t.id === dueToday.id).dueState, 'due-today');
    assert.equal(body.tasks.find((t) => t.id === late.id).dueState, 'overdue');
  } finally {
    for (const t of [dueToday, late]) await deleteTask(t.id);
  }
});
