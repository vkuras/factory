import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask, createTask, deleteTask } from '../helpers.js';

test('S5.1/S5.3 finds a task whose title contains the search text anywhere', async () => {
  await withTask({ title: 'Order milk crate' }, async (task) => {
    const { body } = await api('GET', '/api/tasks?q=milk');
    assert.ok(body.tasks.some((t) => t.id === task.id));
  });
});

test('S5.2/R4 matching ignores case', async () => {
  await withTask({ title: 'Buy Milk' }, async (task) => {
    const { body } = await api('GET', '/api/tasks?q=MILK');
    assert.ok(body.tasks.some((t) => t.id === task.id));
  });
});

test('S5.4 clearing the search text shows the whole list again', async () => {
  await withTask({ title: 'Buy Milk' }, async (task) => {
    await withTask({ title: 'Call the plumber' }, async (other) => {
      const { body } = await api('GET', '/api/tasks?q=');
      assert.ok(body.tasks.some((t) => t.id === task.id));
      assert.ok(body.tasks.some((t) => t.id === other.id));
    });
  });
});

test('S5.5 an unmatched search returns no tasks (the UI shows the no-match message)', async () => {
  const { body } = await api('GET', '/api/tasks?q=zzz-no-such-task-zzz');
  assert.deepEqual(body.tasks, []);
});

test('S6.1 "open only" hides done tasks', async () => {
  const task = await createTask({ title: 'to be finished' });
  try {
    await api('PATCH', `/api/tasks/${task.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks?open=true');
    assert.ok(!body.tasks.some((t) => t.id === task.id));
  } finally {
    await deleteTask(task.id);
  }
});

test('S6.2 "open only" combines with the search text', async () => {
  const doneTask = await createTask({ title: 'Buy Milk done' });
  await withTask({ title: 'Buy Milk open' }, async (openTask) => {
    await api('PATCH', `/api/tasks/${doneTask.id}`, { done: true });
    try {
      const { body } = await api('GET', '/api/tasks?q=milk&open=true');
      assert.ok(body.tasks.some((t) => t.id === openTask.id));
      assert.ok(!body.tasks.some((t) => t.id === doneTask.id));
    } finally {
      await deleteTask(doneTask.id);
    }
  });
});

test('S6.3 switching "open only" off shows done tasks again', async () => {
  const task = await createTask({ title: 'finished again' });
  try {
    await api('PATCH', `/api/tasks/${task.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks');
    assert.ok(body.tasks.some((t) => t.id === task.id));
  } finally {
    await deleteTask(task.id);
  }
});

test('QE7 the search field and list live on the same page', async () => {
  const response = await fetch(`${process.env.BASE_URL ?? 'http://localhost:8080'}/`);
  const html = await response.text();
  assert.match(html, /id="search"/);
  assert.match(html, /id="open-only"/);
});
