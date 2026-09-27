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
    // Done tasks last (S3.2). Within each group, the soonest due date first,
    // tasks without a due date last, and newest first when two share a day
    // or both have none (S2.1, S6.5).
    return [...this.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const aDate = a.dueDate ?? null;
      const bDate = b.dueDate ?? null;
      if (aDate !== bDate) {
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        return aDate < bDate ? -1 : 1;
      }
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
