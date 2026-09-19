// QE5 load test: 10 concurrent searchers, 500 tasks, "open the list, type a
// four-letter query, read the result", with think time.
const base = process.argv[2] ?? 'http://localhost:8123';
const clients = Number(process.argv[3] ?? 10);
const searchesPerClient = Number(process.argv[4] ?? 200);
const queries = ['Call', 'Orde', 'Fix ', 'Clea', 'Send', 'Chec', 'milk', 'Book', 'Prin', 'Answ'];

const latencies = [];
let errors = 0;

async function client(id) {
  for (let i = 0; i < searchesPerClient; i += 1) {
    const q = queries[(id + i) % queries.length];
    const open = i % 3 === 0 ? '&open=true' : '';
    const t0 = performance.now();
    try {
      const res = await fetch(`${base}/api/tasks?q=${encodeURIComponent(q)}${open}`);
      await res.text();
      if (!res.ok) errors += 1;
    } catch {
      errors += 1;
    }
    latencies.push(performance.now() - t0);
    await new Promise((r) => setTimeout(r, 15)); // think time between keystrokes
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: clients }, (_, i) => client(i)));
const wall = performance.now() - started;

latencies.sort((a, b) => a - b);
const pick = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];
console.log(JSON.stringify({
  requests: latencies.length,
  errors,
  wallSeconds: +(wall / 1000).toFixed(1),
  p50ms: +pick(50).toFixed(1),
  p95ms: +pick(95).toFixed(1),
  p99ms: +pick(99).toFixed(1),
  maxms: +latencies[latencies.length - 1].toFixed(1),
}, null, 2));
