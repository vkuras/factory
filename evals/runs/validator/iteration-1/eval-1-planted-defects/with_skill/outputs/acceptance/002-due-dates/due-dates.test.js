import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask } from '../helpers.js';

// "Today" is pinned with the X-Today header (design ADR-0002) so the boundary
// of R4 is stable on any day the suite runs.
const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';

async function listWith(today = TODAY) {
  const { body } = await api('GET', '/api/tasks', undefined, { 'X-Today': today });
  return body.tasks;
}

async function find(id, today = TODAY) {
  return (await listWith(today)).find((t) => t.id === id);
}

test('S5.1 creates a task with a day and shows the day in the list', async () => {
  await withTask({ title: 'Pay the invoice', dueDate: YESTERDAY }, async (task) => {
    assert.equal(task.dueDate, YESTERDAY);
    const listed = await find(task.id);
    assert.equal(listed.dueDate, YESTERDAY);
  });
});

test('S5.2 creates a task without a day', async () => {
  await withTask({ title: 'Sweep the floor' }, async (task) => {
    assert.equal(task.dueDate ?? null, null);
    const listed = await find(task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.done, false);
    assert.equal(listed.title, 'Sweep the floor');
  });
});

test('S5.3 sets a day on a task that has none', async () => {
  await withTask({ title: 'Order paper' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: TOMORROW });
    assert.equal(status, 200);
    assert.equal(body.dueDate, TOMORROW);
    assert.equal((await find(task.id)).dueDate, TOMORROW);
  });
});

for (const bad of ['2026-13-01', '2026-02-30', '19.09.2026', '2026-9-1', 'tomorrow', '2026-09-19T10:00:00Z']) {
  test(`S5.4 rejects the day "${bad}" when creating, with a message about the date`, async () => {
    const { status, body } = await api('POST', '/api/tasks', { title: 'bad day', dueDate: bad });
    assert.equal(status, 400);
    assert.match(body.error, /date/i);
  });
}

test('S5.4 leaves a task unchanged when a bad day is patched', async () => {
  await withTask({ title: 'Keep my day', dueDate: TOMORROW }, async (task) => {
    const { status } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-02-30' });
    assert.equal(status, 400);
    assert.equal((await find(task.id)).dueDate, TOMORROW);
  });
});

test('S5.5 accepts a day that already passed', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'late one', dueDate: '2026-01-02' });
  assert.equal(status, 201);
  assert.equal(body.dueDate, '2026-01-02');
  await api('DELETE', `/api/tasks/${body.id}`);
});

test('S6.1 marks a task whose day is before today as overdue', async () => {
  await withTask({ title: 'yesterday task', dueDate: YESTERDAY }, async (task) => {
    assert.equal((await find(task.id)).dueState, 'overdue');
  });
});

test('S6.2 marks a task due today as due today and not as overdue', async () => {
  await withTask({ title: 'today task', dueDate: TODAY }, async (task) => {
    const listed = await find(task.id);
    assert.notEqual(listed.dueState, 'overdue');
    assert.equal(listed.dueState, 'due-today');
  });
});

test('R4 boundary: yesterday, today and tomorrow get three different states', async () => {
  await withTask({ title: 'b-yesterday', dueDate: YESTERDAY }, async (past) => {
    await withTask({ title: 'b-today', dueDate: TODAY }, async (now) => {
      await withTask({ title: 'b-tomorrow', dueDate: TOMORROW }, async (future) => {
        const tasks = await listWith(TODAY);
        const state = (id) => tasks.find((t) => t.id === id).dueState;
        assert.deepEqual(
          [state(past.id), state(now.id), state(future.id)],
          ['overdue', 'due-today', 'upcoming'],
        );
      });
    });
  });
});

test('S6.3 shows a task after today without an overdue or due-today marking', async () => {
  await withTask({ title: 'tomorrow task', dueDate: TOMORROW }, async (task) => {
    const listed = await find(task.id);
    assert.equal(listed.dueDate, TOMORROW);
    assert.ok(!['overdue', 'due-today'].includes(listed.dueState));
  });
});

test('S6.4 shows no day and no marking for a task without a day', async () => {
  await withTask({ title: 'no day at all' }, async (task) => {
    const listed = await find(task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.dueState, 'none');
  });
});

test('S6.5 orders open tasks by day, soonest first, tasks without a day last', async () => {
  await withTask({ title: 'o-none' }, async (none) => {
    await withTask({ title: 'o-late', dueDate: '2026-12-24' }, async (late) => {
      await withTask({ title: 'o-soon', dueDate: '2026-09-21' }, async (soon) => {
        const ids = (await listWith()).filter((t) => !t.done).map((t) => t.id);
        const order = [soon.id, late.id, none.id].map((id) => ids.indexOf(id));
        assert.ok(order[0] < order[1], `soonest first: ${order}`);
        assert.ok(order[1] < order[2], `tasks without a day last: ${order}`);
      });
    });
  });
});

test('S6.5 + 001 S3.2 keeps done tasks below open ones even with due dates', async () => {
  // The done task has the soonest day: ordering by day must not lift it above
  // the open tasks (001 S3.2, still in force).
  await withTask({ title: 'r-open-later', dueDate: '2026-12-01' }, async (open) => {
    await withTask({ title: 'r-done-soonest', dueDate: '2026-09-01' }, async (done) => {
      await api('PATCH', `/api/tasks/${done.id}`, { done: true });
      const ids = (await listWith()).map((t) => t.id);
      assert.ok(
        ids.indexOf(open.id) < ids.indexOf(done.id),
        'a done task must stay below the open ones',
      );
    });
  });
});

test('R6 keeps tasks without a day working next to tasks with one', async () => {
  await withTask({ title: 'legacy shaped' }, async (legacy) => {
    await withTask({ title: 'dated', dueDate: TOMORROW }, async () => {
      const listed = await find(legacy.id);
      assert.equal(listed.dueState, 'none');
      const { status } = await api('PATCH', `/api/tasks/${legacy.id}`, { done: true });
      assert.equal(status, 200);
    });
  });
});

test('Out of scope: recurring tasks are not part of the product', async () => {
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'standup',
    dueDate: TOMORROW,
    repeat: 'weekly',
  });
  if (status === 201) {
    await api('DELETE', `/api/tasks/${body.id}`);
  }
  assert.ok(
    status !== 201 || body.repeat === undefined || body.repeat === null,
    `the API stored a recurrence: ${JSON.stringify(body)}`,
  );
});

test('Out of scope: times of day are rejected', async () => {
  const { status } = await api('POST', '/api/tasks', { title: 'at three', dueDate: '2026-09-20T15:00' });
  assert.equal(status, 400);
});
