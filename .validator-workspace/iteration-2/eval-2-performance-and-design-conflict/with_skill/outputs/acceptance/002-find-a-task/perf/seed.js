// Fills the list with realistic tasks through the product's own API, so the
// QE5 load test runs against the 500 tasks the requirement names.
//   BASE_URL=http://localhost:8122 node seed.js 500
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const target = Number(process.argv[2] || 500);

const VERBS = ['Buy', 'Order', 'Call', 'Fix', 'Clean', 'Check', 'Return', 'Refill', 'Pay', 'Book'];
const THINGS = [
  'milk', 'Milk bill', 'milk crate', 'the plumber', 'the printer', 'coffee beans',
  'the lamp in the back', 'door handle', 'sticky notes', 'packing tape', 'the invoice',
];

const existing = (await (await fetch(`${BASE_URL}/api/tasks`)).json()).tasks.length;
let created = 0;
for (let i = existing; i < target; i++) {
  const title = `${VERBS[i % VERBS.length]} ${THINGS[i % THINGS.length]} #${i}`;
  const response = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`seed failed at ${i}: ${response.status}`);
  created++;
}
const total = (await (await fetch(`${BASE_URL}/api/tasks`)).json()).tasks.length;
console.log(`created ${created} tasks, list now holds ${total}`);
