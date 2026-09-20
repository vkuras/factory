import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The task list is small enough to keep in memory and flush to a single JSON
// file on every change. That keeps the stack to one container (see ADR-001).
export class TaskStore {
  constructor(dataDir) {
    this.file = join(dataDir, 'tasks.json');
    mkdirSync(dataDir, { recursive: true });
    this.tasks = existsSync(this.file)
      ? JSON.parse(readFileSync(this.file, 'utf8'))
      : [];
    this.nextId = this.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }

  flush() {
    writeFileSync(this.file, JSON.stringify(this.tasks, null, 2));
  }

  list() {
    // Open tasks first and done tasks last, as 001 S3.2 requires. Inside each
    // of those two groups 002 orders by due date: the soonest first, tasks
    // without a due date at the end, and the newest task first within a day.
    return [...this.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const dueA = a.dueDate ?? '9999-12-31';
      const dueB = b.dueDate ?? '9999-12-31';
      if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      return b.id - a.id;
    });
  }

  add(fields) {
    const task = { id: this.nextId++, done: false, ...fields };
    this.tasks.push(task);
    this.flush();
    return task;
  }

  get(id) {
    return this.tasks.find((t) => t.id === id);
  }

  update(id, fields) {
    const task = this.get(id);
    if (!task) return undefined;
    Object.assign(task, fields);
    this.flush();
    return task;
  }

  remove(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    this.flush();
    return true;
  }
}
