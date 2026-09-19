// Black-box acceptance tests for 002 – Find a task.
// They talk to the running stack over HTTP only, exactly like the browser does.
// Derived from docs/requirements/002-find-a-task.md, not from the design or the
// implementation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createTask, deleteTask } from '../helpers.js';

// Creates the given titles, runs the body, and removes them again, so the
// tests stay independent of each other and of their execution order.
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
  return body.tasks.map((task) => task.title);
}

async function search(query, extra = '') {
  const { status, body } = await api('GET', `/api/tasks?q=${encodeURIComponent(query)}${extra}`);
  assert.equal(status, 200);
  return body;
}

test('S5.1 shows only tasks whose title contains the search text', async () => {
  await withTasks(['Buy milk', 'Call the plumber', 'Milk bill'], async () => {
    const body = await search('milk');
    const titles = titlesOf(body);
    assert.ok(titles.includes('Buy milk'), `expected "Buy milk" in ${JSON.stringify(titles)}`);
    assert.ok(titles.includes('Milk bill'), `expected "Milk bill" in ${JSON.stringify(titles)}`);
    assert.ok(
      !titles.includes('Call the plumber'),
      `expected "Call the plumber" to be filtered out of ${JSON.stringify(titles)}`,
    );
  });
});

test('S5.2 ignores upper and lower case: "milk" finds "Buy Milk"', async () => {
  await withTasks(['Buy Milk'], async () => {
    const titles = titlesOf(await search('milk'));
    assert.deepEqual(titles.filter((t) => t === 'Buy Milk'), ['Buy Milk']);
  });
});

test('S5.2 ignores upper and lower case in the other direction: "MILK" finds "Buy milk"', async () => {
  await withTasks(['Buy milk'], async () => {
    const titles = titlesOf(await search('MILK'));
    assert.ok(titles.includes('Buy milk'), `expected "Buy milk" in ${JSON.stringify(titles)}`);
  });
});

test('S5.3 matches text anywhere in the title, not only at its start', async () => {
  await withTasks(['Buy milk'], async () => {
    const titles = titlesOf(await search('milk'));
    assert.ok(titles.includes('Buy milk'), `expected "Buy milk" in ${JSON.stringify(titles)}`);
  });
});

test('S5.3 the stakeholder example: "milk" finds all three spellings', async () => {
  await withTasks(['Buy Milk', 'Order milk crate', 'Milk bill'], async () => {
    const titles = titlesOf(await search('milk'));
    for (const expected of ['Buy Milk', 'Order milk crate', 'Milk bill']) {
      assert.ok(titles.includes(expected), `expected ${expected} in ${JSON.stringify(titles)}`);
    }
  });
});

test('S5.4 an empty search text shows the whole list again', async () => {
  await withTasks(['Buy milk', 'Call the plumber'], async () => {
    const all = titlesOf((await api('GET', '/api/tasks')).body);
    const cleared = titlesOf(await search(''));
    assert.deepEqual(cleared, all);
    assert.ok(cleared.includes('Buy milk') && cleared.includes('Call the plumber'));
  });
});

test('S5.5 answers a search nothing matches with an empty result and the echoed query', async () => {
  await withTasks(['Buy milk'], async () => {
    const body = await search('zzz-nothing-matches-this-zzz');
    assert.deepEqual(body.tasks, []);
    // The UI needs the query back to build "No task matches ...".
    assert.equal(body.query, 'zzz-nothing-matches-this-zzz');
  });
});

test('S6.1 "open only" hides tasks that are done', async () => {
  await withTasks(['open one', 'finished one'], async ([, finished]) => {
    await api('PATCH', `/api/tasks/${finished.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?open=true');
    const titles = titlesOf(body);
    assert.ok(titles.includes('open one'));
    assert.ok(!titles.includes('finished one'), `done task still listed: ${JSON.stringify(titles)}`);
    assert.equal(body.openOnly, true);
  });
});

test('S6.2 "open only" combines with the search text', async () => {
  await withTasks(['milk open', 'milk done', 'bread open'], async ([, milkDone]) => {
    await api('PATCH', `/api/tasks/${milkDone.id}`, { done: true });
    const titles = titlesOf(await search('milk', '&open=true'));
    assert.ok(titles.includes('milk open'), `expected "milk open" in ${JSON.stringify(titles)}`);
    assert.ok(!titles.includes('milk done'));
    assert.ok(!titles.includes('bread open'));
  });
});

test('S6.3 switching "open only" off shows the done tasks again', async () => {
  await withTasks(['still open', 'ticked off'], async ([, ticked]) => {
    await api('PATCH', `/api/tasks/${ticked.id}`, { done: true });
    const hidden = titlesOf((await api('GET', '/api/tasks?open=true')).body);
    assert.ok(!hidden.includes('ticked off'));
    const shown = titlesOf((await api('GET', '/api/tasks')).body);
    assert.ok(shown.includes('ticked off'), `expected "ticked off" in ${JSON.stringify(shown)}`);
  });
});

test('R4 matches case-insensitively anywhere: "milk" finds "MILK"', async () => {
  await withTasks(['MILK'], async () => {
    const titles = titlesOf(await search('milk'));
    assert.ok(titles.includes('MILK'), `expected "MILK" in ${JSON.stringify(titles)}`);
  });
});

test('R4 a search text that no title contains matches nothing', async () => {
  await withTasks(['Buy milk'], async () => {
    assert.deepEqual((await search('kilm')).tasks, []);
  });
});

test('R5 a search changes nothing for anybody else', async () => {
  await withTasks(['Buy milk', 'Call the plumber'], async () => {
    // One client searches ...
    await search('milk');
    // ... and a second, independent client still sees the whole list.
    const titles = titlesOf((await api('GET', '/api/tasks')).body);
    assert.ok(titles.includes('Buy milk') && titles.includes('Call the plumber'));
  });
});

test('Out of scope: the match is exact letters, not fuzzy or typo tolerant', async () => {
  await withTasks(['Buy milk'], async () => {
    assert.deepEqual((await search('mlik')).tasks, [], 'a transposed query must not match');
    assert.deepEqual((await search('milc')).tasks, [], 'a misspelled query must not match');
  });
});

test('Out of scope: only the title is searched', async () => {
  await withTasks(['Buy milk'], async ([task]) => {
    // Neither the id nor the done state is searchable.
    assert.deepEqual((await search(String(task.id))).tasks.filter((t) => t.id === task.id), []);
    assert.deepEqual((await search('false')).tasks.filter((t) => t.id === task.id), []);
  });
});

test('Out of scope: there is no sorting option', async () => {
  await withTasks(['aaa first', 'zzz second'], async () => {
    const plain = titlesOf((await api('GET', '/api/tasks')).body);
    const sortAttempt = titlesOf((await api('GET', '/api/tasks?sort=title')).body);
    assert.deepEqual(sortAttempt, plain, 'an unknown sort parameter must not change the order');
  });
});

test('001 S2.1 regression: a filtered list keeps the newest-first order', async () => {
  await withTasks(['filter order older', 'filter order newer'], async () => {
    const titles = titlesOf(await search('filter order'));
    assert.deepEqual(titles, ['filter order newer', 'filter order older']);
  });
});
