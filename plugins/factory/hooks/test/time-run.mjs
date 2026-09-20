// Runs a command N times with a payload on stdin and prints the slowest wall-clock time in ms.
//   node time-run.mjs <runs> <payload-file|-> <cmd> [args...]
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [runs, payloadFile, cmd, ...args] = process.argv.slice(2);
const input = payloadFile === '-' ? '' : readFileSync(payloadFile);
let slowest = 0;
for (let i = 0; i < Number(runs); i += 1) {
  const started = process.hrtime.bigint();
  const r = spawnSync(cmd, args, { input, encoding: 'utf8' });
  const ms = Number((process.hrtime.bigint() - started) / 1_000_000n);
  if (r.status !== 0 || r.stdout !== '' || r.stderr !== '') {
    console.log(`BAD status=${r.status} stdout=${JSON.stringify(r.stdout)} stderr=${JSON.stringify(r.stderr)}`);
    process.exit(0);
  }
  slowest = Math.max(slowest, ms);
}
console.log(slowest);
