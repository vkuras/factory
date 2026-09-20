import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask } from '../helpers.js';

test('S1.1 adds a task and returns it as not done', async () => {
  await withTask({ title: 'Buy milk' }, async (task) => {
    assert.equal(task.title, 'Buy milk');
    assert.equal(task.done, false);
    assert.ok(Number.isInteger(task.id));
  });
});

test('S1.1 shows the new task in the list', async () => {
  await withTask({ title: 'Call the plumber' }, async (task) => {
    const { body } = await api('GET', '/api/tasks');
    assert.ok(body.tasks.some((t) => t.id === task.id && t.title === 'Call the plumber'));
  });
});

test('S1.2 rejects an empty title with a message', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: '   ' });
  assert.equal(status, 400);
  assert.match(body.error, /title/i);
});

test('S1.3 rejects a title longer than 200 characters', async () => {
  const { status } = await api('POST', '/api/tasks', { title: 'x'.repeat(201) });
  assert.equal(status, 400);
});

test('S1.3 accepts a title of exactly 200 characters', async () => {
  const { status, body } = await api('POST', '/api/tasks', { title: 'y'.repeat(200) });
  assert.equal(status, 201);
  await api('DELETE', `/api/tasks/${body.id}`);
});

test('S2.1 lists the newest open task first', async () => {
  await withTask({ title: 'older task' }, async () => {
    await withTask({ title: 'newer task' }, async () => {
      const { body } = await api('GET', '/api/tasks');
      const open = body.tasks.filter((t) => !t.done).map((t) => t.title);
      assert.ok(open.indexOf('newer task') < open.indexOf('older task'));
    });
  });
});

test('S3.1 marks a task as done', async () => {
  await withTask({ title: 'Water the plants' }, async (task) => {
    const { status, body } = await api('PATCH', `/api/tasks/${task.id}`, { done: true });
    assert.equal(status, 200);
    assert.equal(body.done, true);
  });
});

test('S3.2 sorts done tasks below open ones', async () => {
  // The open task is created first on purpose: a list that simply shows the
  // newest task first would pass this by accident the other way round.
  await withTask({ title: 'still open' }, async () => {
    await withTask({ title: 'to be done' }, async (doneTask) => {
      await api('PATCH', `/api/tasks/${doneTask.id}`, { done: true });
      const { body } = await api('GET', '/api/tasks');
      const titles = body.tasks.map((t) => t.title);
      assert.ok(
        titles.indexOf('still open') < titles.indexOf('to be done'),
        `done task was not below the open one: ${titles.join(', ')}`,
      );
    });
  });
});

test('S4.1 deletes a task', async () => {
  const { body: task } = await api('POST', '/api/tasks', { title: 'Cancel the subscription' });
  const { status } = await api('DELETE', `/api/tasks/${task.id}`);
  assert.equal(status, 204);
  const { body } = await api('GET', '/api/tasks');
  assert.ok(!body.tasks.some((t) => t.id === task.id));
});

test('S4.2 reports deleting a task that does not exist', async () => {
  const { status, body } = await api('DELETE', '/api/tasks/999999');
  assert.equal(status, 404);
  assert.match(body.error, /does not exist/i);
});

test('QE3 serves the UI in English', async () => {
  const response = await fetch(`${process.env.BASE_URL ?? 'http://localhost:8080'}/`);
  const html = await response.text();
  assert.match(html, /<html lang="en"/);
  assert.match(html, /Add task/);
});
