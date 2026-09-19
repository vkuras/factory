// Black-box acceptance tests for 002 – Find a task.
// They check the running stack over HTTP against the acceptance criteria and
// business rules of docs/requirements/002-find-a-task.md, not against the
// design. Every test cleans up the tasks it creates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createTask, deleteTask, BASE_URL } from '../helpers.js';

// A marker keeps these tasks apart from anything else on the stack.
const M = `z${Date.now().toString(36)}`;

async function withTasks(titles, run) {
  const created = [];
  try {
    for (const title of titles) created.push(await createTask({ title }));
    return await run(created);
  } finally {
    for (const task of created) await deleteTask(task.id);
  }
}

function titles(body) {
  return body.tasks.map((t) => t.title);
}

test('S5.1 the search shows only the tasks that contain the text', async () => {
  await withTasks([`Buy Milk ${M}`, `Call the supplier ${M}`], async () => {
    const { status, body } = await api('GET', `/api/tasks?q=${encodeURIComponent(`Buy Milk ${M}`)}`);
    assert.equal(status, 200);
    assert.deepEqual(titles(body), [`Buy Milk ${M}`]);
  });
});

test('S5.2 upper and lower case make no difference', async () => {
  await withTasks([`Buy Milk ${M}`], async () => {
    const { body } = await api('GET', `/api/tasks?q=${encodeURIComponent(`buy milk ${M}`)}`);
    assert.deepEqual(titles(body), [`Buy Milk ${M}`], 'searching "buy milk" must find "Buy Milk"');
  });
});

test('S5.3 the text may sit anywhere in the title', async () => {
  await withTasks([`Buy milk ${M}`], async () => {
    const { body } = await api('GET', `/api/tasks?q=${encodeURIComponent('milk')}`);
    assert.ok(
      titles(body).includes(`Buy milk ${M}`),
      'searching "milk" must find "Buy milk", not only titles that start with it',
    );
  });
});

test('S5.3 the stakeholder example: "milk" finds all three tasks', async () => {
  await withTasks([`Buy Milk ${M}`, `Order milk crate ${M}`, `Milk bill ${M}`], async () => {
    const { body } = await api('GET', `/api/tasks?q=${encodeURIComponent('milk')}`);
    const found = titles(body).filter((t) => t.endsWith(M));
    assert.deepEqual(
      found.sort(),
      [`Buy Milk ${M}`, `Milk bill ${M}`, `Order milk crate ${M}`],
      'R4: "milk" matches anywhere in the title, ignoring case',
    );
  });
});

test('S5.4 clearing the search text shows the whole list again', async () => {
  await withTasks([`Buy Milk ${M}`, `Call the supplier ${M}`], async () => {
    const { body: filtered } = await api('GET', `/api/tasks?q=${encodeURIComponent(`Buy Milk ${M}`)}`);
    assert.equal(filtered.tasks.length, 1);
    const { body: all } = await api('GET', '/api/tasks?q=');
    const mine = titles(all).filter((t) => t.endsWith(M));
    assert.equal(mine.length, 2);
  });
});

test('S5.5 a search that matches nothing answers with an empty list, not an error', async () => {
  await withTasks([`Buy Milk ${M}`], async () => {
    const { status, body } = await api('GET', `/api/tasks?q=${encodeURIComponent(`nothing-matches-${M}`)}`);
    assert.equal(status, 200);
    assert.deepEqual(body.tasks, []);
    assert.equal(body.query, `nothing-matches-${M}`, 'the query is echoed so the UI can name it');
  });
});

test('S5.5 the UI has a no-match message instead of an empty screen', async () => {
  const page = await fetch(`${BASE_URL}/app.js`).then((r) => r.text());
  assert.match(page, /No task matches/, 'the UI states that nothing matched');
});

test('S6.1 "open only" shows only tasks that are not done', async () => {
  await withTasks([`Open task ${M}`, `Done task ${M}`], async ([, done]) => {
    await api('PATCH', `/api/tasks/${done.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?open=true');
    const mine = titles(body).filter((t) => t.endsWith(M));
    assert.deepEqual(mine, [`Open task ${M}`]);
  });
});

test('S6.2 "open only" combines with the search text', async () => {
  await withTasks([`Buy milk ${M}`, `Order milk crate ${M}`], async ([, second]) => {
    await api('PATCH', `/api/tasks/${second.id}`, { done: true });
    const { body } = await api('GET', `/api/tasks?open=true&q=${encodeURIComponent('milk')}`);
    const mine = titles(body).filter((t) => t.endsWith(M));
    assert.deepEqual(mine, [`Buy milk ${M}`], 'only open tasks that match the text');
  });
});

test('S6.3 switching "open only" off shows the done tasks again', async () => {
  await withTasks([`Open task ${M}`, `Done task ${M}`], async ([, done]) => {
    await api('PATCH', `/api/tasks/${done.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks');
    const mine = titles(body).filter((t) => t.endsWith(M));
    assert.equal(mine.length, 2);
  });
});

test('R5 searching stores nothing and does not change the list for anybody', async () => {
  await withTasks([`Buy Milk ${M}`, `Call the supplier ${M}`], async () => {
    const before = await api('GET', '/api/tasks');
    await api('GET', `/api/tasks?q=${encodeURIComponent('milk')}&open=true`);
    const after = await api('GET', '/api/tasks');
    assert.deepEqual(after.body.tasks, before.body.tasks, 'the unfiltered list is unchanged');
  });
});

test('QE7 the search field sits above the list, on the page itself', async () => {
  const html = await fetch(`${BASE_URL}/`).then((r) => r.text());
  const search = html.indexOf('id="search"');
  const list = html.indexOf('id="tasks"');
  assert.ok(search > -1, 'the page has a search field');
  assert.ok(list > -1 && search < list, 'the search field comes before the list');
  assert.match(html, /id="open-only"/, 'the page has an "open only" control');
});
