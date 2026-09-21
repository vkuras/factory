// A history the size the design was budgeted for: 300 tickets, 3 000 agent runs, one repository.
// Everything goes in through the reporting API, like every other report.
import { run, intervention, H, DAY } from '../lib/report.mjs';

const PROJECT = 'github.com/vkuras/invoice-service';
const AGENTS = ['groom', 'architect', 'implementer', 'validator'];
const STATUSES = [
  'In grooming', 'Groomed – ready for architecture', 'Designed – ready for implementation',
  'Implemented – ready for validation', 'Validated', 'Changes requested – back to implementation',
  'Blocked – waiting for architecture', 'Blocked – waiting for requirements',
];
const now = Date.now();
const TICKETS = Number(process.env.TICKETS || 300);
const RUNS = Number(process.env.RUNS_PER_TICKET || 10);

let runs = 0;
for (let i = 0; i < TICKETS; i++) {
  const ticket = String(100 + i).padStart(3, '0');
  const age = (i % 120) * DAY + 3 * H;
  const status = STATUSES[i % STATUSES.length];
  for (let r = 0; r < RUNS; r++) {
    const startedAt = now - age + r * 2 * H;
    await run({
      project: PROJECT,
      ticket,
      title: `Bulk ticket ${ticket}: a title of about the length a real one has`,
      agent: AGENTS[r % AGENTS.length],
      startedAt,
      endedAt: startedAt + 1.4 * H,
      statusBefore: STATUSES[r % STATUSES.length],
      statusAfter: r === RUNS - 1 ? status : STATUSES[(r + 1) % STATUSES.length],
      output: `STATUS: ${['groomed', 'designed', 'ready-for-validation', 'changes-requested'][r % 4]}\nREQUIREMENTS: docs/requirements/${ticket}-bulk.md\nOne more line of output so the numbered list has something to show.\nSUMMARY: Run ${r + 1} of ticket ${ticket}.`,
      tokens: 10000 + ((i * 37 + r * 11) % 90000),
    });
    runs++;
  }
  if (i % 7 === 0) await intervention({ project: PROJECT, ticket, title: `Bulk ticket ${ticket}`, ts: now - age + RUNS * H, status, what: 'noted, carry on' });
  if (i % 25 === 0) process.stdout.write(`${i} tickets, ${runs} runs\n`);
}
console.log(`seeded ${TICKETS} tickets and ${runs} runs`);
