// Creates the dataset of a phase through the product's reporting API.
//   node seed/seed.mjs main | old | second | snapshot
import { writeFileSync } from 'node:fs';
import { seedMain, seedOldHistory, seedSecondRepository } from './dataset.mjs';
import { page } from '../lib/report.mjs';

const what = process.argv[2];
const WORK = process.env.WORK || '/work';

if (what === 'main') {
  await seedMain(Date.now());
} else if (what === 'old') {
  await seedOldHistory(Date.now());
} else if (what === 'second') {
  await seedSecondRepository(Date.now());
} else if (what === 'snapshot') {
  // S1.8: what the operator sees before a second repository has ever reported.
  const snap = { overview: (await page('/')).text, tickets: {} };
  for (const n of ['001', '004', '007', '010']) snap.tickets[n] = (await page(`/ticket/${n}`)).text;
  writeFileSync(`${WORK}/snapshot-before-second-repo.json`, JSON.stringify(snap, null, 1));
} else {
  throw new Error('unknown phase ' + what);
}
console.log('seeded: ' + what);
