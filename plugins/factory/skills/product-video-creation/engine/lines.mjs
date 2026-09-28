// Every spoken line of the video, in order. `text` is what the viewer may see and
// what Kokoro speaks, with its own natural pauses at sentence and list breaks.
// `voice` is a Kokoro voice from voices.mjs: the narrator is usually af_heart,
// and the people in scene 1 are cast from CAST so that speakers next to each
// other differ in gender or locale (US / UK). Optional per line: `say` (respell
// or add a deliberate beat with [[slnc N]]), `speed` (0.9–1.1).
// PRONOUNCE respells words for every line, e.g. { Pegel: 'Paygel' }.
export const PRONOUNCE = {};

export const lines = [
  // S1 · the problem
  // { id: 'p1', voice: 'am_michael', text: "…" },
  // { id: 'p2', voice: 'bf_emma', text: "…" },
  // S2 · getting access (optional)
  // S3 · the product: narration here is triggered from flows/product.mjs
  // { id: 's3_intro', voice: 'af_heart', text: "…" },
  // S4 · what it solves
];
