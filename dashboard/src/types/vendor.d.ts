// Minimal declarations for the two production dependencies that ship no types. Only the surface
// this code uses is declared, so a new call has to be added here on purpose.

declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  interface Statement<Row = Record<string, unknown>> {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): Row | undefined;
    all(...params: unknown[]): Row[];
  }
  interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
  }
  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare<Row = Record<string, unknown>>(sql: string): Statement<Row>;
    exec(sql: string): this;
    pragma(source: string, options?: { simple?: boolean }): unknown;
    transaction<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R;
    close(): this;
    readonly open: boolean;
  }
  export default Database;
  export type { Statement, RunResult };
}

declare module 'ejs' {
  interface Options {
    views?: string[];
    async?: false;
    cache?: boolean;
    filename?: string;
  }
  const ejs: {
    renderFile(path: string, data: Record<string, unknown>, options: Options): Promise<string>;
    escapeXML(value: unknown): string;
  };
  export default ejs;
}
