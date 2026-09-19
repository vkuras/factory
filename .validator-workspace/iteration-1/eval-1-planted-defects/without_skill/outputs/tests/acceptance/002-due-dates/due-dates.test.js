import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, api, withTask } from '../helpers.js';

// The day every test pins with the X-Today header, so the result never
// depends on the day the suite runs (design 002, "Test strategy").
const TODAY = '2026-09-19';
const YESTERDAY = '2026-09-18';
const TOMORROW = '2026-09-20';

function listOn(day) {
  return api('GET', '/api/tasks', undefined, { 'X-Today': day });
}

async function findTask(day, id) {
  const { body } = await listOn(day);
  return body.tasks.find((t) => t.id === id);
}

test('S5.1 creates a task with a due date and shows the day in the list', async () => {
  await withTask({ title: 'Pay the invoice', dueDate: YESTERDAY }, async (task) => {
    assert.equal(task.dueDate, YESTERDAY);
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueDate, YESTERDAY);
  });
});

test('S5.2 creates a task without a due date and it stays without one', async () => {
  await withTask({ title: 'No day at all' }, async (task) => {
    assert.equal(task.dueDate ?? null, null);
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.dueState, 'none');
  });
});

test('S5.3 sets a due date on a task that had none', async () => {
  await withTask({ title: 'Gets a day later' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: TOMORROW });
    assert.equal(status, 200);
    assert.equal(body.dueDate, TOMORROW);
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueDate, TOMORROW);
  });
});

test('S5.4 rejects a due date in the wrong format with a message about the date', async () => {
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'Wrong format',
    dueDate: '19.09.2026',
  });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 rejects a day that does not exist', async () => {
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'No such day',
    dueDate: '2026-02-30',
  });
  assert.equal(status, 400);
  assert.match(body.error, /date/i);
});

test('S5.4 does not change a task when the new due date is invalid', async () => {
  await withTask({ title: 'Keeps its day', dueDate: TOMORROW }, async (task) => {
    const { status } = await api('PATCH', `/api/tasks/${task.id}`, { dueDate: '2026-13-01' });
    assert.equal(status, 400);
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueDate, TOMORROW);
  });
});

test('S5.5 accepts a day that already passed', async () => {
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'Already late',
    dueDate: '2026-01-02',
  });
  assert.equal(status, 201);
  assert.equal(body.dueDate, '2026-01-02');
  await api('DELETE', `/api/tasks/${body.id}`);
});

test('S6.1 / R4 marks a task due before today as overdue', async () => {
  await withTask({ title: 'Late one', dueDate: YESTERDAY }, async (task) => {
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueState, 'overdue');
  });
});

test('S6.2 / R4 marks a task due today as due-today and not as overdue', async () => {
  await withTask({ title: 'Today one', dueDate: TODAY }, async (task) => {
    const listed = await findTask(TODAY, task.id);
    assert.equal(
      listed.dueState,
      'due-today',
      `a task due today must not be overdue, got "${listed.dueState}"`,
    );
  });
});

test('S6.3 marks a task due after today as upcoming', async () => {
  await withTask({ title: 'Future one', dueDate: TOMORROW }, async (task) => {
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueState, 'upcoming');
  });
});

test('S6.4 gives a task without a day no day and no marking', async () => {
  await withTask({ title: 'Undated' }, async (task) => {
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.dueDate ?? null, null);
    assert.equal(listed.dueState, 'none');
  });
});

test('S6.5 orders tasks by day, soonest first, undated last', async () => {
  await withTask({ title: 'ord undated' }, async () => {
    await withTask({ title: 'ord late', dueDate: '2026-12-01' }, async () => {
      await withTask({ title: 'ord soon', dueDate: '2026-09-21' }, async () => {
        const { body } = await listOn(TODAY);
        const titles = body.tasks.map((t) => t.title).filter((t) => t.startsWith('ord '));
        assert.deepEqual(titles, ['ord soon', 'ord late', 'ord undated']);
      });
    });
  });
});

test('S6.5 / S3.2 keeps done tasks below open ones while ordering by day', async () => {
  await withTask({ title: 'grp open late', dueDate: '2026-12-01' }, async () => {
    await withTask({ title: 'grp done soon', dueDate: '2026-09-20' }, async (doneTask) => {
      await api('PATCH', `/api/tasks/${doneTask.id}`, { done: true });
      const { body } = await listOn(TODAY);
      const titles = body.tasks.map((t) => t.title).filter((t) => t.startsWith('grp '));
      assert.deepEqual(
        titles,
        ['grp open late', 'grp done soon'],
        'done tasks must stay below open ones (001 S3.2), the due date orders within each group',
      );
    });
  });
});

test('R4 the boundary moves with the day, not with the data', async () => {
  await withTask({ title: 'Boundary', dueDate: TODAY }, async (task) => {
    assert.equal((await findTask(YESTERDAY, task.id)).dueState, 'upcoming');
    assert.equal((await findTask(TODAY, task.id)).dueState, 'due-today');
    assert.equal((await findTask(TOMORROW, task.id)).dueState, 'overdue');
  });
});

test('R6 a task stored without a due date keeps working', async () => {
  await withTask({ title: 'Old style task' }, async (task) => {
    const { status } = await api('PATCH', `/api/tasks/${task.id}`, { done: true });
    assert.equal(status, 200);
    const listed = await findTask(TODAY, task.id);
    assert.equal(listed.done, true);
    assert.equal(listed.dueState, 'none');
  });
});

test('QE6 the overdue marking carries a word, not only a colour', async () => {
  const response = await fetch(`${BASE_URL}/app.js`);
  const source = await response.text();
  assert.match(source, /Overdue/);
  assert.match(source, /Due today/);
});

test('QE7 the add form is one line of inputs and one button', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  const form = html.slice(html.indexOf('<form'), html.indexOf('</form>'));
  const inputs = form.match(/<input/g) ?? [];
  const buttons = form.match(/<button/g) ?? [];
  assert.equal(buttons.length, 1, 'the add form must have exactly one button');
  assert.equal(
    inputs.length,
    2,
    `the add form must hold only the title and the day, found: ${form.replace(/\s+/g, ' ')}`,
  );
});

test('Out of scope: the product has no recurring tasks', async () => {
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'Recurring probe',
    repeat: 'weekly',
  });
  if (status === 201) {
    await api('DELETE', `/api/tasks/${body.id}`);
  }
  assert.ok(
    status !== 201 || body.repeat === undefined || body.repeat === null,
    `recurring tasks are out of scope, but the API stored repeat=${JSON.stringify(body.repeat)}`,
  );
});
