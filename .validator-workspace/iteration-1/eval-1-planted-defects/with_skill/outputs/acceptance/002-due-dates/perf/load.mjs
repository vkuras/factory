// Load scenario for the product-wide performance constraint (001 QE4: opening
// the list and adding a task feel instant, well under a second). It models what
// the stories describe – ten team members who open the list, add a task with a
// day, tick it off and delete it – instead of hammering one endpoint.
//
//   BASE_URL=http://localhost:8110 node tests/acceptance/002-due-dates/perf/load.mjs
//
// It runs on plain Node so it needs nothing installed (the product has no
// third-party dependencies on purpose).
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
const USERS = Number(process.env.USERS ?? 10);
const ROUNDS = Number(process.env.ROUNDS ?? 10);
const THINK_MS = Number(process.env.THINK_MS ?? 50);

const latencies = [];
let errors = 0;

async function timed(run) {
  const started = performance.now();
  const result = await run();
  latencies.push(performance.now() - started);
  return result;
}

async function member(n) {
  for (let i = 0; i < ROUNDS; i++) {
    await timed(() => fetch(`${BASE_URL}/api/tasks`).then((r) => r.json()));
    const task = await timed(() =>
      fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `perf ${n}-${i}`, dueDate: '2026-09-25' }),
      }).then((r) => {
        if (r.status !== 201) errors++;
        return r.json();
      }),
    );
    await timed(() =>
      fetch(`${BASE_URL}/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, THINK_MS));
    await timed(() => fetch(`${BASE_URL}/api/tasks/${task.id}`, { method: 'DELETE' }));
  }
}

await Promise.all([...Array(USERS)].map((_, n) => member(n)));

latencies.sort((a, b) => a - b);
const percentile = (q) => latencies[Math.floor(latencies.length * q)].toFixed(1);
console.log(
  `users=${USERS} requests=${latencies.length} errors=${errors} ` +
    `p50=${percentile(0.5)}ms p95=${percentile(0.95)}ms max=${latencies.at(-1).toFixed(1)}ms`,
);
process.exit(errors === 0 && Number(percentile(0.95)) < 1000 ? 0 : 1);
