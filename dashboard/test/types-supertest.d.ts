// supertest ships no types and the design's dev dependencies do not include @types/supertest;
// this declares only what the tests call.
declare module 'supertest' {
  interface Response {
    status: number;
    text: string;
    headers: Record<string, string | undefined>;
  }
  interface Test extends PromiseLike<Response> {
    set(name: string, value: string): Test;
    send(body?: string): Test;
    redirects(count: number): Test;
  }
  interface Agent {
    get(path: string): Test;
    post(path: string): Test;
    put(path: string): Test;
    delete(path: string): Test;
    patch(path: string): Test;
  }
  export default function request(app: unknown): Agent;
}
