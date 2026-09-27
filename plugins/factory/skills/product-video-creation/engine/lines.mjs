// Every spoken line of the video, in order. `text` is what the viewer may see;
// tts.mjs speaks it with the premium `voice` and adds the pauses at sentence and
// list breaks itself. Give a line its own `say` only to respell or re-pause it.
// PRONOUNCE respells words for every line, e.g. { Pegel: 'Paygel' }.
export const PRONOUNCE = {};

export const lines = [
  // S1 · the problem
  // { id: 'p1', voice: 'Ava', text: "…" },
  // S2 · getting access (optional)
  // S3 · the product: narration here is triggered from flows/product.mjs
  // S4 · what it solves
];
