// Shared helpers for the black-box acceptance tests. They talk to the running
// stack over HTTP only, exactly like a browser or any other client would.
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export async function api(method, path, body, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = text === '' ? undefined : JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, body: json, text };
}

export async function createTask(fields) {
  const response = await api('POST', '/api/tasks', fields);
  if (response.status !== 201) {
    throw new Error(`Could not create a task: ${response.status} ${response.text}`);
  }
  return response.body;
}

export async function deleteTask(id) {
  await api('DELETE', `/api/tasks/${id}`);
}

// Every test cleans up after itself so the tests stay independent of each
// other and of their execution order.
export async function withTask(fields, run) {
  const task = await createTask(fields);
  try {
    return await run(task);
  } finally {
    await deleteTask(task.id);
  }
}
