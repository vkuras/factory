// Black-box acceptance tests for 002 – Find a task.
//
// They check the behaviour the requirements describe
// (docs/requirements/002-find-a-task.md), over HTTP only, exactly like a
// browser would. They deliberately do not encode the design's match rule:
// a requirement is what the product has to do.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, api, createTask, deleteTask } from '../helpers.js';

// Creates a set of tasks, runs the body, and removes them again, so the tests
// stay independent of each other and of their order.
async function withTasks(titles, run) {
  const tasks = [];
  try {
    for (const title of titles) tasks.push(await createTask({ title }));
    return await run(tasks);
  } finally {
    for (const task of tasks) await deleteTask(task.id);
  }
}

function titlesOf(body) {
  return body.tasks.map((t) => t.title);
}

test('S5.1 shows only the tasks whose title contains the typed text', async () => {
  await withTasks(['Buy milk', 'Call the supplier', 'Order milk crate'], async () => {
    const { status, body } = await api('GET', '/api/tasks?q=milk');
    assert.equal(status, 200);
    const titles = titlesOf(body);
    assert.ok(titles.includes('Buy milk'), `"Buy milk" missing: ${titles.join(', ')}`);
    assert.ok(titles.includes('Order milk crate'), `"Order milk crate" missing: ${titles.join(', ')}`);
    assert.ok(
      !titles.includes('Call the supplier'),
      `a task that does not contain "milk" was shown: ${titles.join(', ')}`,
    );
  });
});

test('S5.2 ignores upper and lower case: "milk" finds "Buy Milk"', async () => {
  await withTasks(['Buy Milk'], async () => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    assert.ok(
      titlesOf(body).includes('Buy Milk'),
      `"Buy Milk" was not found for the query "milk": ${titlesOf(body).join(', ')}`,
    );
  });
});

test('S5.2 ignores upper and lower case in the other direction: "MILK" finds "Buy milk"', async () => {
  await withTasks(['Buy milk'], async () => {
    const { body } = await api('GET', '/api/tasks?q=MILK');
    assert.ok(
      titlesOf(body).includes('Buy milk'),
      `"Buy milk" was not found for the query "MILK": ${titlesOf(body).join(', ')}`,
    );
  });
});

test('S5.3 matches text anywhere in the title, not only at its start', async () => {
  await withTasks(['Buy milk'], async () => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    assert.ok(
      titlesOf(body).includes('Buy milk'),
      `"Buy milk" was not found for the query "milk": ${titlesOf(body).join(', ')}`,
    );
  });
});

test('R4 the stakeholder example: "milk" finds all three spellings', async () => {
  await withTasks(['Buy Milk', 'Order milk crate', 'MILK bill', 'Call the supplier'], async () => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    const titles = titlesOf(body);
    for (const expected of ['Buy Milk', 'Order milk crate', 'MILK bill']) {
      assert.ok(titles.includes(expected), `"${expected}" missing for "milk": ${titles.join(', ')}`);
    }
    assert.ok(!titles.includes('Call the supplier'), `unrelated task shown: ${titles.join(', ')}`);
  });
});

test('S5.4 an empty search text shows the whole list again', async () => {
  await withTasks(['Buy milk', 'Call the supplier'], async () => {
    const { body: all } = await api('GET', '/api/tasks');
    const { body: cleared } = await api('GET', '/api/tasks?q=');
    assert.deepEqual(titlesOf(cleared), titlesOf(all));
    assert.ok(titlesOf(cleared).includes('Call the supplier'));
  });
});

test('S5.5 a text no task contains returns no tasks, and the UI has a no-match message', async () => {
  await withTasks(['Buy milk'], async () => {
    const { status, body } = await api('GET', '/api/tasks?q=zzzznothingmatchesthis');
    assert.equal(status, 200);
    assert.deepEqual(body.tasks, []);
    assert.equal(body.query, 'zzzznothingmatchesthis');
  });
  const response = await fetch(`${BASE_URL}/app.js`);
  const script = await response.text();
  assert.match(script, /No task matches/, 'the UI has no no-match message');
});

test('S6.1 "open only" shows only tasks that are not done', async () => {
  await withTasks(['still open', 'already finished'], async (tasks) => {
    const finished = tasks[1];
    await api('PATCH', `/api/tasks/${finished.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?open=true');
    const titles = titlesOf(body);
    assert.ok(titles.includes('still open'));
    assert.ok(!titles.includes('already finished'), `a done task was shown: ${titles.join(', ')}`);
    assert.ok(body.tasks.every((t) => t.done === false));
  });
});

test('S6.2 "open only" combines with the search text', async () => {
  await withTasks(['Buy milk', 'Buy milk crate', 'Call the supplier'], async (tasks) => {
    await api('PATCH', `/api/tasks/${tasks[1].id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?q=milk&open=true');
    const titles = titlesOf(body);
    assert.ok(titles.includes('Buy milk'), `open matching task missing: ${titles.join(', ')}`);
    assert.ok(!titles.includes('Buy milk crate'), `done matching task shown: ${titles.join(', ')}`);
    assert.ok(!titles.includes('Call the supplier'), `non-matching task shown: ${titles.join(', ')}`);
  });
});

test('S6.3 switching "open only" off shows the done tasks again', async () => {
  await withTasks(['still open', 'already finished'], async (tasks) => {
    await api('PATCH', `/api/tasks/${tasks[1].id}`, { done: true });
    const { body } = await api('GET', '/api/tasks');
    assert.ok(titlesOf(body).includes('already finished'));
    assert.equal(body.openOnly, false);
  });
});

test('R5 searching stores nothing and does not change what anybody else sees', async () => {
  await withTasks(['Buy milk', 'Call the supplier'], async () => {
    const { body: before } = await api('GET', '/api/tasks');
    await api('GET', '/api/tasks?q=milk&open=true');
    // A second client, who never searched, still sees the whole list.
    const { body: after } = await api('GET', '/api/tasks');
    assert.deepEqual(titlesOf(after), titlesOf(before));
  });
});

test('R5 a search never writes: repeated searches leave the task ids untouched', async () => {
  await withTasks(['Buy milk'], async (tasks) => {
    for (const q of ['m', 'mi', 'mil', 'milk']) await api('GET', `/api/tasks?q=${q}`);
    const { body } = await api('GET', '/api/tasks');
    assert.ok(body.tasks.some((t) => t.id === tasks[0].id && t.title === 'Buy milk'));
  });
});

test('QE7 the search is one field above the list, with no button to press', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  const search = html.indexOf('id="search"');
  const list = html.indexOf('id="tasks"');
  assert.ok(search > -1, 'no search field in the UI');
  assert.ok(list > -1, 'no list in the UI');
  assert.ok(search < list, 'the search field is not above the list');
  const row = html.slice(search, list);
  assert.ok(!/<button/i.test(row), 'there is a button between the search field and the list');
  assert.ok(/id="open-only"/.test(row), 'no "open only" control above the list');
});
