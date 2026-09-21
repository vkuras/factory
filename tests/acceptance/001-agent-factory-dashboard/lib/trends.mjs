// S5.2: what a trend card has to say about its own change.
//
// The statement is whatever the card prints next to its label. The requirement asks for two things
// — the change between the first and the last week shown, and whether that change is an
// improvement — and says nothing about the form. The design states it relatively while the first
// rendered week is not 0 and absolutely in the card's own unit when it is (§R8, gap G3), so both
// `+30% vs w35 · worse` and `+0.7 vs w14 · worse` are a change; `no comparison yet` is not.

export const TREND_LABELS = ['Human calls / ticket', 'Loops / ticket', 'Lead time (h)', 'Compute (h)'];

const STATEMENT = /^([+-]?\d+(?:\.\d+)?%? vs w\d+ · (?:better|worse|unchanged)|no comparison yet)$/;

/** The HTML of one trend card, from its label to the next one. */
export function trendCard(analyticsHtml, label) {
  const start = analyticsHtml.indexOf(`>${label}<`);
  if (start === -1) throw new Error(`the trend "${label}" is not on the page`);
  const next = TREND_LABELS.map((l) => analyticsHtml.indexOf(`>${l}<`))
    .filter((i) => i > start)
    .sort((a, b) => a - b)[0];
  return analyticsHtml.slice(start, next ?? analyticsHtml.indexOf('Per ticket'));
}

/** What the card says about itself: its buckets, its statement and the verdict word. */
export function readTrend(analyticsHtml, label) {
  const card = trendCard(analyticsHtml, label);
  const bars = [...card.matchAll(/title="(w\d+) · ([^"]*)"/g)].map((m) => ({
    week: m[1],
    value: m[2] === 'no data' ? null : Number(m[2]),
  }));
  const said = card.match(/>([^<>]*(?:vs w\d+ · (?:better|worse|unchanged))|no comparison yet)</);
  const withValue = bars.filter((b) => b.value !== null);
  return {
    label,
    card,
    bars,
    statement: said ? said[1].trim() : null,
    verdict: said ? (said[1].match(/· (better|worse|unchanged)$/) || [])[1] ?? null : null,
    first: withValue[0] ?? null,
    last: withValue[withValue.length - 1] ?? null,
    countWithValue: withValue.length,
  };
}

/**
 * Checks one card against S5.2 and returns the complaints, so a test can report all four cards at
 * once. Every metric of this product is better when it falls, which is what makes one rule enough.
 */
export function complaintsAbout(t) {
  const out = [];
  const seen = `${t.label}: said ${JSON.stringify(t.statement)}, first ${t.first?.week}=${t.first?.value}, last ${t.last?.week}=${t.last?.value}, ${t.countWithValue} of ${t.bars.length} weeks with a value`;
  if (t.statement === null) return [`${seen} — says nothing at all about the change`];
  if (!STATEMENT.test(t.statement)) return [`${seen} — the statement is not readable as a change and a verdict`];

  if (t.statement === 'no comparison yet') {
    if (t.countWithValue >= 2) out.push(`${seen} — two or more weeks carry a value, so there is a change to state`);
    return out;
  }
  if (t.countWithValue < 2) out.push(`${seen} — states a change although fewer than two weeks carry a value`);
  if (t.first && !t.statement.includes(`vs ${t.first.week}`)) {
    out.push(`${seen} — the change is not stated against the first week shown`);
  }
  if (t.first && t.last) {
    const expected = t.last.value < t.first.value ? 'better' : t.last.value > t.first.value ? 'worse' : 'unchanged';
    if (t.verdict !== expected) out.push(`${seen} — calls it "${t.verdict}" where the numbers went ${expected}`);
  }
  return out;
}
