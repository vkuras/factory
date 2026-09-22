import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, withTask } from '../helpers.js';

// S5 (search by text) is not covered here yet: the design's match rule
// contradicts R4/S5.2/S5.3 and is blocked on an architect decision — see
// docs/architecture/.gaps/002-find-a-task.md, G1. Only S6 (open only),
// as far as it does not depend on the search text, is built.

test('S6.1 open=true hides done tasks', async () => {
  await withTask({ title: 'still open one' }, async (open) => {
    await withTask({ title: 'finished one' }, async (done) => {
      await api('PATCH', `/api/tasks/${done.id}`, { done: true });
      const { body } = await api('GET', '/api/tasks?open=true');
      const ids = body.tasks.map((t) => t.id);
      assert.ok(ids.includes(open.id));
      assert.ok(!ids.includes(done.id));
    });
  });
});

test('S6.3 switching open=true off shows done tasks again', async () => {
  await withTask({ title: 'to finish' }, async (task) => {
    await api('PATCH', `/api/tasks/${task.id}`, { done: true });
    const { body } = await api('GET', '/api/tasks');
    assert.ok(body.tasks.some((t) => t.id === task.id));
  });
});
