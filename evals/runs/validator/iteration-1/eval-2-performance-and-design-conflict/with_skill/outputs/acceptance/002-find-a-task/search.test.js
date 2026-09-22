// Black-box acceptance tests for 002 – Find a task.
// They talk to the running stack over HTTP only, exactly like the browser does.
// Derived from docs/requirements/002-find-a-task.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createTask, deleteTask, withTask } from '../helpers.js';

// Creates a set of tasks, runs the body with them and always removes them again,
// so the tests stay independent of each other and of their order.
async function withTasks(titles, run) {
  const tasks = [];
  try {
    for (const title of titles) tasks.push(await createTask({ title }));
    return await run(tasks);
  } finally {
    for (const task of tasks) await deleteTask(task.id);
  }
}

const titlesOf = (body) => body.tasks.map((t) => t.title);

test('S5.1 returns only tasks whose title contains the search text', async () => {
  await withTasks(
    ['S51 paint the fence', 'S51 water the plants', 'S51 fence panel order'],
    async () => {
      const { status, body } = await api('GET', '/api/tasks?q=fence');
      assert.equal(status, 200);
      const found = titlesOf(body).filter((t) => t.startsWith('S51 '));
      assert.deepEqual(found.sort(), ['S51 fence panel order', 'S51 paint the fence']);
      assert.ok(
        body.tasks.every((t) => t.title.toLowerCase().includes('fence')),
        `every returned task must contain the search text, got ${JSON.stringify(titlesOf(body))}`,
      );
    },
  );
});

test('S5.2 ignores upper and lower case ("Buy Milk" is found by "milk")', async () => {
  await withTask({ title: 'S52 Buy Milk' }, async (task) => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    assert.ok(
      body.tasks.some((t) => t.id === task.id),
      `"S52 Buy Milk" must be found by "milk", got ${JSON.stringify(titlesOf(body))}`,
    );
  });
});

test('S5.3 matches text anywhere in the title, not only at its start', async () => {
  await withTask({ title: 'S53 Buy milk' }, async (task) => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    assert.ok(
      body.tasks.some((t) => t.id === task.id),
      `"S53 Buy milk" must be found by "milk", got ${JSON.stringify(titlesOf(body))}`,
    );
  });
});

test('S5.4 clearing the search text shows the whole list again', async () => {
  await withTasks(['S54 alpha item', 'S54 beta item'], async (tasks) => {
    const filtered = await api('GET', '/api/tasks?q=alpha');
    assert.ok(!titlesOf(filtered.body).includes('S54 beta item'));
    const all = await api('GET', '/api/tasks?q=');
    for (const task of tasks) {
      assert.ok(all.body.tasks.some((t) => t.id === task.id), 'every task is listed again');
    }
    const omitted = await api('GET', '/api/tasks');
    for (const task of tasks) {
      assert.ok(omitted.body.tasks.some((t) => t.id === task.id), 'a missing q lists everything');
    }
  });
});

test('S5.5 a search that nothing matches answers with an empty result, not an error', async () => {
  await withTask({ title: 'S55 sharpen the knives' }, async () => {
    const { status, body } = await api('GET', '/api/tasks?q=zzqqxnothingmatches');
    assert.equal(status, 200);
    assert.deepEqual(body.tasks, []);
    assert.equal(body.query, 'zzqqxnothingmatches');
  });
});

test('S6.1 "open only" returns only tasks that are not done', async () => {
  await withTasks(['S61 open task', 'S61 finished task'], async ([open, finished]) => {
    await api('PATCH', `/api/tasks/${finished.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?open=true');
    assert.ok(body.tasks.some((t) => t.id === open.id), 'the open task is listed');
    assert.ok(!body.tasks.some((t) => t.id === finished.id), 'the done task is hidden');
    assert.ok(body.tasks.every((t) => t.done === false), 'no done task is returned');
    assert.equal(body.openOnly, true);
  });
});

test('S6.2 "open only" combined with a search text returns only matching open tasks', async () => {
  await withTasks(
    ['S62 order milk crate', 'S62 milk bill', 'S62 order coffee'],
    async ([openMilk, doneMilk]) => {
      await api('PATCH', `/api/tasks/${doneMilk.id}`, { done: true });
      const { body } = await api('GET', '/api/tasks?q=milk&open=true');
      assert.ok(body.tasks.some((t) => t.id === openMilk.id), 'the open matching task is listed');
      assert.ok(!body.tasks.some((t) => t.id === doneMilk.id), 'the done matching task is hidden');
      assert.ok(
        body.tasks.every((t) => t.done === false && t.title.toLowerCase().includes('milk')),
        `only open matching tasks, got ${JSON.stringify(titlesOf(body))}`,
      );
    },
  );
});

test('S6.3 switching "open only" off shows the done tasks again', async () => {
  await withTasks(['S63 open one', 'S63 done one'], async ([open, done]) => {
    await api('PATCH', `/api/tasks/${done.id}`, { done: true });
    const hidden = await api('GET', '/api/tasks?open=true');
    assert.ok(!hidden.body.tasks.some((t) => t.id === done.id));
    const shown = await api('GET', '/api/tasks');
    assert.ok(shown.body.tasks.some((t) => t.id === done.id), 'the done task is visible again');
    assert.ok(shown.body.tasks.some((t) => t.id === open.id));
  });
});

test('R4 "milk" matches "Buy Milk", "Order milk crate" and "MILK"', async () => {
  await withTasks(['R4 Buy Milk', 'R4 Order milk crate', 'R4 MILK'], async (tasks) => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    const returned = new Set(body.tasks.map((t) => t.id));
    const missing = tasks.filter((t) => !returned.has(t.id)).map((t) => t.title);
    assert.deepEqual(missing, [], `these must match "milk" but did not: ${missing.join(', ')}`);
  });
});

test('R4 an upper-case search text finds a lower-case title', async () => {
  await withTask({ title: 'R4 buy milk' }, async (task) => {
    const { body } = await api('GET', '/api/tasks?q=MILK');
    assert.ok(body.tasks.some((t) => t.id === task.id), '"MILK" must find "R4 buy milk"');
  });
});

test('R5 a search does not change what another client sees', async () => {
  await withTasks(['R5 alpha', 'R5 beta'], async (tasks) => {
    await api('GET', '/api/tasks?q=alpha&open=true');
    const other = await api('GET', '/api/tasks');
    for (const task of tasks) {
      assert.ok(other.body.tasks.some((t) => t.id === task.id), 'the other client still sees everything');
    }
  });
});

test('R5 a search changes nothing that survives it (the stored list is unchanged)', async () => {
  await withTasks(['R5 stored one', 'R5 stored two'], async (tasks) => {
    const before = await api('GET', '/api/tasks');
    await api('GET', '/api/tasks?q=stored');
    await api('GET', '/api/tasks?open=true');
    const after = await api('GET', '/api/tasks');
    assert.deepEqual(
      after.body.tasks.map((t) => `${t.id}:${t.title}:${t.done}`),
      before.body.tasks.map((t) => `${t.id}:${t.title}:${t.done}`),
      'searching must not change the list',
    );
    assert.ok(tasks.length === 2);
  });
});

test('S5.1 + 001 S3.2 filtered results keep the list order: open first, newest first', async () => {
  await withTasks(['ORD filter older', 'ORD filter newer'], async ([older, newer]) => {
    await withTask({ title: 'ORD filter done' }, async (done) => {
      await api('PATCH', `/api/tasks/${done.id}`, { done: true });
      const { body } = await api('GET', '/api/tasks?q=ORD filter');
      const ids = body.tasks.filter((t) => t.title.startsWith('ORD filter')).map((t) => t.id);
      assert.deepEqual(ids, [newer.id, older.id, done.id], 'newest open first, done last');
    });
  });
});

test('Out of scope: the search is not typo tolerant', async () => {
  await withTask({ title: 'OOS Buy milk' }, async () => {
    const { body } = await api('GET', '/api/tasks?q=mlik');
    assert.ok(
      !body.tasks.some((t) => t.title === 'OOS Buy milk'),
      'a typo must not match (no fuzzy matching)',
    );
  });
});

test('Out of scope: nothing but the title is searched', async () => {
  await withTask({ title: 'OOS only the title' }, async (task) => {
    const byId = await api('GET', `/api/tasks?q=${task.id}`);
    assert.ok(!byId.body.tasks.some((t) => t.id === task.id), 'the id is not searched');
    const byDone = await api('GET', '/api/tasks?q=false');
    assert.ok(!byDone.body.tasks.some((t) => t.id === task.id), 'the done state is not searched');
  });
});

test('Out of scope: the API offers no sorting option', async () => {
  await withTasks(['SORT aaa', 'SORT zzz'], async () => {
    const plain = await api('GET', '/api/tasks');
    const sorted = await api('GET', '/api/tasks?sort=title&order=asc');
    assert.deepEqual(
      sorted.body.tasks.map((t) => t.id),
      plain.body.tasks.map((t) => t.id),
      'a sort parameter must have no effect',
    );
  });
});

test('QE7 the search field sits above the list on the one page, with no search button', async () => {
  const page = await api('GET', '/');
  assert.equal(page.status, 200);
  const html = page.text;
  const searchAt = html.search(/<input[^>]*id="search"/);
  const listAt = html.search(/id="tasks"/);
  assert.ok(searchAt > -1, 'there is a search field');
  assert.ok(listAt > -1 && searchAt < listAt, 'the search field is above the list');
  const findRow = html.slice(searchAt, listAt);
  assert.ok(!/<button/i.test(findRow), 'there is no search button');
  assert.ok(/id="open-only"/.test(findRow), 'the "open only" switch is in the same row');
});
