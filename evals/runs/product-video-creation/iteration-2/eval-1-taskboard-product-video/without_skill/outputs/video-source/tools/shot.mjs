// usage: node shot.mjs <url> <out.png> <width> <height> [dpr] [mobile]
import { writeFileSync } from 'node:fs';
import { launch } from './cdp.mjs';

const [url, out, w = '1920', h = '1080', dpr = '1', mobile = ''] = process.argv.slice(2);
const b = await launch({ width: Number(w), height: Number(h) });
try {
  const p = await b.newPage({ w: Number(w), h: Number(h), dpr: Number(dpr), mobile: mobile === 'mobile' });
  await p.goto(url);
  await new Promise((r) => setTimeout(r, 400));
  writeFileSync(out, await p.screenshot());
  console.log('wrote', out);
} finally {
  await b.close();
}
