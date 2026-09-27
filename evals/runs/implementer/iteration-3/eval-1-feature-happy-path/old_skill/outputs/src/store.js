import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The task list is small enough to keep in memory and flush to a single JSON
// file on every change. That keeps the stack to one container (see ADR-001).
export class TaskStore {
  constructor(dataDir) {
    this.file = join(dataDir, 'tasks.json');
    mkdirSync(dataDir, { recursive: true });
    const stored = existsSync(this.file)
      ? JSON.parse(readFileSync(this.file, 'utf8'))
      : [];
    // 002 R6: a task written before this feature has no dueDate key at all;
    // the code reads that missing key as null so the rest of the store never
    // has to distinguish "missing" from "explicitly cleared".
    this.tasks = stored.map((task) => ({ dueDate: null, ...task }));
    this.nextId = this.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }

  flush() {
    writeFileSync(this.file, JSON.stringify(this.tasks, null, 2));
  }

  list() {
    // Open tasks first, done tasks last (S3.2, unchanged by 002). Within each
    // group: soonest due date first, no due date last, newest task first when
    // two share a day (S6.5, 002).
    return [...this.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.dueDate !== b.dueDate) {
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      return b.id - a.id;
    });
  }

  add(fields) {
    const task = { id: this.nextId++, done: false, dueDate: null, ...fields };
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
