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
    // Open tasks first, done tasks last (S3.2). Within each group, the
    // soonest due date first and tasks without one last (S6.5); ties
    // (including two tasks with no date) keep the newest first (S2.1).
    return [...this.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const aDue = a.dueDate ?? null;
      const bDue = b.dueDate ?? null;
      if (aDue !== bDue) {
        if (aDue === null) return 1;
        if (bDue === null) return -1;
        return aDue < bDue ? -1 : 1;
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
