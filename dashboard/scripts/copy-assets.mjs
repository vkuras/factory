// Copies what tsc does not emit (templates, stylesheet, client script) next to the compiled code
// and the IBM Plex woff2 files out of the pinned @fontsource dev dependencies.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

cpSync(join(root, 'src/views'), join(dist, 'views'), { recursive: true });
cpSync(join(root, 'src/public'), join(dist, 'public'), { recursive: true });

const fonts = join(dist, 'public/fonts');
mkdirSync(fonts, { recursive: true });
const wanted = [
  ['@fontsource/ibm-plex-sans', 'ibm-plex-sans', [400, 500, 600, 700]],
  ['@fontsource/ibm-plex-mono', 'ibm-plex-mono', [400, 500, 600]],
];
for (const [pkg, prefix, weights] of wanted) {
  for (const weight of weights) {
    const name = `${prefix}-latin-${weight}-normal.woff2`;
    const src = join(root, 'node_modules', pkg, 'files', name);
    if (!existsSync(src)) throw new Error(`font file missing: ${src}`);
    cpSync(src, join(fonts, name));
  }
}
