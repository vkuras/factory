import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, api, withTask } from '../helpers.js';

// The day is pinned with the X-Today header (design 002, ADR-0002), so these
// tests give the same result whatever day they run on.
const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';

async function listOn(day = TODAY) {
  const response = await fetch(`${BASE_URL}/api/tasks`, { headers: { 'X-Today': day } });
  const body = await response.json();
  return body.tasks;
}

async function stateOf(id, day = TODAY) {
  const tasks = await listOn(day);
  return tasks.find((task) => task.id === id)?.dueState;
}

test('S5.1 creates a task with a due date and shows the date', async () => {
  await withTask({ title: 'Pay the invoice', dueDate: TOMORROW }, async (task) => {
    assert.equal(task.dueDate, TOMORROW);
    const tasks = await listOn();
    assert.equal(tasks.find((t) => t.id === task.id).dueDate, TOMORROW);
  });
});

test('S5.2 creates a task without a due date', async () => {
  await withTask({ title: 'Something undated' }, async (task) => {
    assert.equal(task.dueDate, null);
    assert.equal(await stateOf(task.id), 'none');
  });
});

test('S5.3 sets a due date on a task that had none', async () => {
  await withTask({ title: 'Later given a date' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: TOMORROW });
    assert.equal(status, 200);
    assert.equal(body.dueDate, TOMORROW);
  });
});

test('S5.4 rejects a due date in the wrong format', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'bad date', dueDate: '19.09.2026' });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects a day that does not exist', async () => {
  const { status } = await api('POST', '/api/tasks', { title: 'bad date', dueDate: '2026-02-30' });
  assert.equal(status, 400);
});

test('S5.5 accepts a due date that already passed', async () => {
  await withTask({ title: 'Already late', dueDate: '2026-01-02' }, async (task) => {
    assert.equal(task.dueDate, '2026-01-02');
  });
});

test('S6.1 marks a task due before today as overdue', async () => {
  await withTask({ title: 'Was due yesterday', dueDate: YESTERDAY }, async (task) => {
    assert.equal(await stateOf(task.id), 'overdue');
  });
});

test('S6.2 marks a task due today as due today and not as overdue', async () => {
  await withTask({ title: 'Due today', dueDate: TODAY }, async (task) => {
    assert.equal(await stateOf(task.id), 'due-today');
  });
});

test('S6.3 marks a task due after today as upcoming', async () => {
  await withTask({ title: 'Due tomorrow', dueDate: TOMORROW }, async (task) => {
    assert.equal(await stateOf(task.id), 'upcoming');
  });
});

test('S6.4 gives a task without a due date no marking', async () => {
  await withTask({ title: 'No date at all' }, async (task) => {
    assert.equal(await stateOf(task.id), 'none');
  });
});

test('S6.5 lists the soonest due date first', async () => {
  await withTask({ title: 'due later', dueDate: '2026-11-30' }, async (later) => {
    await withTask({ title: 'due sooner', dueDate: '2026-10-01' }, async (sooner) => {
      const ids = (await listOn()).map((t) => t.id);
      assert.ok(ids.indexOf(sooner.id) < ids.indexOf(later.id));
    });
  });
});

test('S6.5 lists tasks without a due date after dated ones', async () => {
  await withTask({ title: 'undated one' }, async (undated) => {
    await withTask({ title: 'dated one', dueDate: '2026-12-24' }, async (dated) => {
      const ids = (await listOn()).map((t) => t.id);
      assert.ok(ids.indexOf(dated.id) < ids.indexOf(undated.id));
    });
  });
});

test('QE6 names the state in words, not only by colour', async () => {
  const response = await fetch(`${BASE_URL}/app.js`);
  const source = await response.text();
  assert.match(source, /Overdue/);
  assert.match(source, /Due today/);
});
