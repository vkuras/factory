// Minimal helpers to look at the delivered HTML the way a reader of the page would:
// which panel, which card, in which order, with which text. No product code, no DOM library.

import { asText } from './report.mjs';

export function panel(html, name) {
  const re = new RegExp(`<section data-panel="${name}"[\\s\\S]*?</section>`);
  const m = html.match(re);
  if (!m) throw new Error(`panel ${name} is not in the page`);
  return m[0];
}

/** The hrefs of every card of a kind, in the order they appear — that is the order on screen. */
export function links(html, cls) {
  return [...html.matchAll(new RegExp(`<a href="([^"]+)" class="${cls}"`, 'g'))].map((m) => m[1]);
}

/** The ticket numbers of those cards, in order. */
export function ticketNumbers(html, cls) {
  return links(html, cls).map((href) => href.replace(/\?.*$/, '').split('/').pop());
}

/** Every card of a kind as its own chunk of HTML, in order. */
export function cards(html, cls) {
  const marker = `class="${cls}"`;
  const out = [];
  let from = html.indexOf(marker);
  while (from !== -1) {
    const next = html.indexOf(marker, from + 1);
    const start = html.lastIndexOf('<a ', from);
    out.push(html.slice(start === -1 ? from : start, next === -1 ? html.length : html.lastIndexOf('<a ', next)));
    from = next;
  }
  return out;
}

export function cardTexts(html, cls) {
  return cards(html, cls).map(asText);
}

/** The text between two markers, for the panels that have no card class of their own. */
export function between(text, from, to) {
  const a = text.indexOf(from);
  if (a === -1) throw new Error(`"${from}" is not on the page`);
  const b = to ? text.indexOf(to, a + from.length) : -1;
  return text.slice(a, b === -1 ? text.length : b);
}
