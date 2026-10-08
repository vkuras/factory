// Deterministic video stage. Every visual is a pure function of the virtual time t,
// except the real Taskboard app in the two iframes, which is driven by scheduled
// actions (focus, type, submit, tick, delete, reload) that run before the frame at
// their time is rendered, and are awaited until the app has settled.
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, t0, d) => clamp((t - t0) / d);
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const backOut = (u) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };

let TL;
const SC = {}, PH = {};
const S = (id) => SC[id];
const P = (id) => PH[id];

// ---------------------------------------------------------------- devices
const dev = {
  laptop: { frame: $('#laptopFrame'), box: $('#laptop') },
  phone: { frame: $('#phoneFrame'), box: $('#phone') },
};
const doc = (d) => dev[d].frame.contentDocument;

function instrument(d) {
  const w = dev[d].frame.contentWindow;
  if (w.__instrumented) return;
  const orig = w.fetch.bind(w);
  w.__pending = 0;
  w.__lastNet = performance.now();
  w.fetch = (...args) => {
    w.__pending++;
    w.__lastNet = performance.now();
    return orig(...args).finally(() => { w.__pending--; w.__lastNet = performance.now(); });
  };
  w.__instrumented = true;
  // The real caret blinks on wall-clock time; hide it and draw a deterministic one instead.
  const st = w.document.createElement('style');
  st.textContent = 'input{caret-color:transparent}';
  w.document.head.appendChild(st);
}

async function waitLoaded(d) {
  for (let i = 0; i < 400; i++) {
    const dd = dev[d].frame.contentDocument;
    if (dd && dd.readyState === 'complete' && dd.querySelectorAll('#tasks li').length > 0) {
      instrument(d);
      await sleep(60);
      return;
    }
    await sleep(25);
  }
  throw new Error('app did not load in ' + d);
}

async function settle(d) {
  const w = dev[d].frame.contentWindow;
  const t0 = performance.now();
  await sleep(20);
  while (w.__pending > 0 || performance.now() - w.__lastNet < 120) {
    if (performance.now() - t0 > 8000) throw new Error('settle timeout ' + d);
    await sleep(10);
  }
}

async function reloadFrame(d) {
  const f = dev[d].frame;
  const loaded = new Promise((r) => f.addEventListener('load', r, { once: true }));
  f.contentWindow.location.reload();
  await loaded;
  await waitLoaded(d);
}

const act = {
  focus(d, sel) { doc(d).querySelector(sel).focus({ preventScroll: true }); },
  setValue(d, sel, v) {
    const el = doc(d).querySelector(sel);
    el.value = v;
    el.dispatchEvent(new (dev[d].frame.contentWindow.Event)('input', { bubbles: true }));
  },
  async submit(d) {
    const dd = doc(d);
    dd.querySelector('#title').blur();
    dd.querySelector('#new-task button[type=submit]').click();
    await settle(d);
  },
  async check(d, id) {
    doc(d).querySelector(`li[data-id="${id}"] input[type=checkbox]`).click();
    await settle(d);
  },
  async del(d, id) {
    doc(d).querySelector(`li[data-id="${id}"] button`).click();
    await settle(d);
  },
  reload: (d) => reloadFrame(d),
};

// ------------------------------------------------------------- geometry
function stageRectOf(d, el) {
  const f = dev[d].frame;
  const fr = f.getBoundingClientRect();
  const s = fr.width / f.offsetWidth;
  const r = el.getBoundingClientRect();
  return { x: fr.left + r.left * s, y: fr.top + r.top * s, w: r.width * s, h: r.height * s, s };
}

function resolveRect(target) {
  if (target.xy) return { x: target.xy[0], y: target.xy[1], w: 0, h: 0, s: 1 };
  if (target.stageSel) {
    const b = $(target.stageSel).getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, s: 1 };
  }
  const dd = doc(target.dev);
  const el = dd && dd.querySelector(target.sel);
  if (!el) return null;
  return stageRectOf(target.dev, el);
}

function resolvePoint(target) {
  const r = resolveRect(target);
  if (!r) return null;
  return { x: r.x + r.w * (target.ax ?? 0.5), y: r.y + r.h * (target.ay ?? 0.5) };
}

// ------------------------------------------------------------ choreography
const moves = { laptop: [], phone: [] };   // {t, dur, to}
const initial = {};
const items = [];                           // text / decor items: {el, tIn, tOut, opts}
const events = [];                          // {t, run}
const cursorTracks = [];                    // {tIn, tOut, start, moves:[{t0,t1,to}]}
const clicks = [];                          // {t, target, kind}
const taps = [];                            // {t, target}
const highlights = [];                      // {t0, t1, target, color, el}
const carets = [];                          // {d, sel, t0, t1, typingUntil}
const custom = [];                          // per-frame functions (t) => void

const L = {
  laptopBelow:  { x: 740, y: 1190, s: 0.95, o: 1 },
  laptopIntro:  { x: 730, y: 150, s: 0.95, o: 1 },
  laptopOpen:   { x: 690, y: 206, s: 0.8, o: 1 },
  laptopZoom:   { x: 700, y: 100, s: 1.25, o: 1 },
  laptopShared: { x: 684, y: 206, s: 0.8, o: 1 },
  laptopOut:    { x: 760, y: 1220, s: 1.0, o: 0 },
  phoneOff:     { x: 2060, y: 190, s: 0.8, o: 1 },
  phoneOpen:    { x: 1484, y: 188, s: 0.8, o: 1 },
  phoneShared:  { x: 1476, y: 160, s: 0.85, o: 1 },
};

function on(t, run) { events.push({ t, run }); }

function typeInto(d, sel, text, t0, perChar) {
  for (let k = 1; k <= text.length; k++) {
    const v = text.slice(0, k);
    on(t0 + (k - 1) * perChar, () => act.setValue(d, sel, v));
  }
  return t0 + (text.length - 1) * perChar;
}

function group(id, spec, tOut) {
  const els = [...$(`#${id}`).querySelectorAll('.it')];
  spec.forEach((tIn, i) => items.push({ el: els[i], tIn, tOut }));
}

const ROW = (d, id) => ({ dev: d, sel: `li[data-id="${id}"]` });
const CHECK = (d, id) => ({ dev: d, sel: `li[data-id="${id}"] input[type=checkbox]`, ax: 0.5, ay: 0.5 });
const DELBTN = (d, id) => ({ dev: d, sel: `li[data-id="${id}"] button`, ax: 0.45, ay: 0.5 });
const INPUT = (d) => ({ dev: d, sel: '#title', ax: d === 'laptop' ? 0.62 : 0.3, ay: 0.55 });
const ADDBTN = (d) => ({ dev: d, sel: '#new-task button[type=submit]', ax: 0.5, ay: 0.55 });

function build() {
  const dur = (id) => P(id).end - P(id).start;

  // -------- hook: whiteboard gets wiped, chat scrolls away
  const introStart = S('intro').start;
  group('g-hook', [0.25, 0.35, P('h2').start - 0.15], introStart);
  items.push({ el: $('#board'), tIn: 0.1, tOut: introStart, opts: { x: 720, y: 380, dy: 36 } });
  items.push({ el: $('#chat'), tIn: 0.3, tOut: introStart + 0.08, opts: { x: 1410, y: 240, dy: 36 } });

  const eraseT0 = P('h2').start - 0.05, eraseDur = 1.45;
  custom.push((t) => {
    const u = prog(t, eraseT0, eraseDur);
    const x = lerp(-60, 620, ease(u));
    const y = 170 + 120 * Math.sin(u * Math.PI * 3.2);
    const er = $('#eraser');
    er.style.transform = `translate(${x}px, ${y}px) rotate(${-8 + 16 * Math.sin(u * Math.PI * 6)}deg)`;
    er.style.opacity = u > 0 && u < 1 ? 1 : (u >= 1 ? 1 - prog(t, eraseT0 + eraseDur, 0.3) : 0);
    const wiped = clamp(x + 75, 0, 610);
    $('#scribbles').style.clipPath = `inset(0 0 0 ${u > 0 ? wiped : 0}px)`;
    $('#smudge').style.opacity = u > 0 ? 1 : 0;
    $('#smudge').style.clipPath = `inset(0 ${610 - (u > 0 ? wiped : 0)}px 0 0)`;
  });

  const col = $('#chatcol');
  const msgs = [...col.children];
  const bodyH = col.parentElement.clientHeight;
  const bottomOf = (i) => msgs[i].offsetTop + msgs[i].offsetHeight;
  const y0 = Math.max(bodyH - bottomOf(2) - 14, 14);
  const y1 = bodyH - bottomOf(msgs.length - 1) - 14;
  const scrollT0 = P('h2').start + 1.1, scrollDur = 1.9;
  custom.push((t) => {
    const u = ease(prog(t, scrollT0, scrollDur));
    col.style.transform = `translateY(${lerp(y0, y1, u)}px)`;
  });

  // -------- intro: what it is
  initial.laptop = L.laptopBelow;
  initial.phone = L.phoneOff;
  moves.laptop.push({ t: introStart + 0.15, dur: 1.3, to: L.laptopIntro });
  group('g-intro', [introStart + 0.35, P('i2').start - 0.1, P('i3').start + 0.05, P('i3').start + 1.9], S('open').start);

  // -------- open: laptop or phone, no login
  const o = S('open').start;
  moves.laptop.push({ t: o, dur: 0.95, to: L.laptopOpen });
  moves.phone.push({ t: o + 0.2, dur: 1.05, to: L.phoneOpen });
  group('g-open', [o + 0.3, o + 0.35, P('o1').start + 0.3, P('o2').start + 0.1, P('o2').start + 0.85, P('o2').start + 1.75], S('add').start);

  // -------- add: write it down
  const a = S('add').start;
  moves.phone.push({ t: a, dur: 0.8, to: L.phoneOff });
  moves.laptop.push({ t: a + 0.05, dur: 1.05, to: L.laptopZoom });
  group('g-add', [a + 0.35, a + 0.4, P('a2').start - 0.2, P('a3').start - 0.1], S('done').start);

  const trackA = { tIn: a + 0.9, tOut: S('done').end - 0.35, start: { xy: [1520, 1010] }, moves: [] };
  cursorTracks.push(trackA);
  trackA.moves.push({ t0: P('a1').start + 0.55, t1: P('a2').start - 0.08, to: INPUT('laptop') });
  const focusA = P('a2').start;
  clicks.push({ t: focusA, target: INPUT('laptop'), kind: 'mouse' });
  on(focusA, () => act.focus('laptop', '#title'));
  const typeEndA = typeInto('laptop', '#title', 'Order printer paper', P('a2').start + 0.28, 0.062);
  const mvA0 = typeEndA + 0.1, mvA1 = mvA0 + 0.5;
  trackA.moves.push({ t0: mvA0, t1: mvA1, to: ADDBTN('laptop') });
  const clickAdd = Math.max(mvA1 + 0.12, P('a2').end - 0.35);
  clicks.push({ t: clickAdd, target: ADDBTN('laptop'), kind: 'mouse' });
  on(clickAdd, () => act.submit('laptop'));
  carets.push({ d: 'laptop', sel: '#title', t0: focusA, t1: clickAdd, typingUntil: typeEndA });
  highlights.push({ t0: clickAdd + 0.05, t1: P('a3').end + 0.6, target: ROW('laptop', 7), color: 'green' });

  // -------- done: tick it off
  const dn = S('done').start;
  group('g-done', [dn + 0.2, dn + 0.25, P('d2').start - 0.1, P('d2').start + 2.5], S('shared').start);
  trackA.moves.push({ t0: dn + 0.2, t1: P('d1').end - 0.45, to: CHECK('laptop', 4) });
  const clickTick = P('d1').end - 0.25;
  clicks.push({ t: clickTick, target: CHECK('laptop', 4), kind: 'mouse' });
  on(clickTick, () => act.check('laptop', 4));
  trackA.moves.push({ t0: clickTick + 0.55, t1: clickTick + 1.25, to: { xy: [1830, 700] } });
  highlights.push({ t0: clickTick + 0.08, t1: P('d2').end + 0.35, target: ROW('laptop', 4), color: 'green' });

  // -------- shared: teammates add from their phones, reload to see it
  const sh = S('shared').start;
  on(sh + 0.02, () => act.reload('phone'));
  moves.laptop.push({ t: sh, dur: 1.0, to: L.laptopShared });
  moves.phone.push({ t: sh + 0.25, dur: 1.0, to: L.phoneShared });
  group('g-shared', [sh + 0.3, sh + 0.35, P('s1').start + 0.1, P('s2').start - 0.1], S('delete').start);

  const tap1 = P('s1').start + 0.45;
  taps.push({ t: tap1, target: INPUT('phone') });
  on(tap1, () => act.focus('phone', '#title'));
  const typeEndB = typeInto('phone', '#title', 'Buy coffee beans', P('s1').start + 0.7, 0.068);
  const tap2 = typeEndB + 0.5;
  taps.push({ t: tap2, target: ADDBTN('phone') });
  on(tap2, () => act.submit('phone'));
  carets.push({ d: 'phone', sel: '#title', t0: tap1, t1: tap2, typingUntil: typeEndB });
  highlights.push({ t0: tap2 + 0.05, t1: P('s2').start + 1.3, target: ROW('phone', 8), color: 'green' });

  const reloadClick = P('s2').start + 0.55 * dur('s2');
  const trackB = { tIn: P('s2').start - 0.25, tOut: S('shared').end - 0.15, start: { xy: [1200, 700] }, moves: [] };
  cursorTracks.push(trackB);
  trackB.moves.push({ t0: P('s2').start + 0.25, t1: reloadClick - 0.12, to: { stageSel: '#reload', ax: 0.5, ay: 0.5 } });
  clicks.push({ t: reloadClick, target: { stageSel: '#reload', ax: 0.5, ay: 0.5 }, kind: 'mouse' });
  on(reloadClick, () => act.reload('laptop'));
  highlights.push({ t0: reloadClick + 0.1, t1: S('shared').end + 0.3, target: ROW('laptop', 8), color: 'green' });

  // -------- delete: mistakes only, no undo
  const de = S('delete').start;
  moves.phone.push({ t: de, dur: 0.8, to: L.phoneOff });
  moves.laptop.push({ t: de + 0.05, dur: 1.05, to: L.laptopZoom });
  group('g-delete', [de + 0.3, de + 0.35, P('x1').start + 1.2, P('x2').start + 0.15], S('simple').start);
  const clickDel = P('x2').start - 0.15;
  highlights.push({ t0: P('x1').start + 1.35, t1: clickDel + 0.02, target: ROW('laptop', 8), color: 'amber' });
  highlights.push({ t0: P('x1').start + 1.35, t1: clickDel + 0.5, target: ROW('laptop', 2), color: 'amber' });
  const trackC = { tIn: de + 0.85, tOut: S('delete').end - 0.15, start: { xy: [1540, 1010] }, moves: [] };
  cursorTracks.push(trackC);
  trackC.moves.push({ t0: P('x1').start + 0.9, t1: clickDel - 0.2, to: DELBTN('laptop', 8) });
  clicks.push({ t: clickDel, target: DELBTN('laptop', 8), kind: 'mouse' });
  on(clickDel, () => act.del('laptop', 8));
  trackC.moves.push({ t0: clickDel + 0.5, t1: clickDel + 1.2, to: { xy: [1835, 800] } });

  // -------- simple on purpose
  const si = S('simple').start;
  moves.laptop.push({ t: si, dur: 0.85, to: L.laptopOut });
  group('g-simple', [si + 0.35, si + 0.4], S('outro').start);
  const cardIn = P('m1').start + 0.45;
  items.push({ el: $('#nots'), tIn: cardIn, tOut: S('outro').start, opts: { x: 960, y: 250, dy: 40 } });
  const strikeAt = [0.3, 1.45, 2.7].map((x) => P('m2').start + Math.min(x, dur('m2') - 0.3));
  custom.push((t) => {
    ['#not1', '#not2', '#not3'].forEach((sel, k) => {
      const row = $(sel);
      const label = row.querySelector('span');
      const u = easeOut(prog(t, strikeAt[k], 0.35));
      const strike = row.querySelector('.strike');
      strike.style.width = `${u * (label.offsetWidth + 20)}px`;
      row.style.opacity = 1 - 0.45 * u;
    });
  });
  items.push({ el: $('#justlist'), tIn: P('m3').start - 0.08, tOut: S('outro').start, opts: { x: 1000, y: 700, dy: 0, pop: true } });

  // -------- outro
  group('g-outro', [S('outro').start + 0.4, P('e1').start + 1.3, P('e2').start - 0.15], null);

  events.sort((p, q) => p.t - q.t);
}

// --------------------------------------------------------------- rendering
function deviceState(d, t) {
  let cur = initial[d];
  for (const m of moves[d]) {
    if (t < m.t) break;
    const u = ease(prog(t, m.t, m.dur));
    cur = u >= 1 ? m.to : {
      x: lerp(cur.x, m.to.x, u), y: lerp(cur.y, m.to.y, u), s: lerp(cur.s, m.to.s, u), o: lerp(cur.o, m.to.o, u),
    };
    if (u < 1) break;
  }
  return cur;
}

function renderItem(it, t) {
  const o = it.opts || {};
  const u = easeOut(prog(t, it.tIn, 0.55));
  const v = it.tOut == null ? 0 : ease(prog(t, it.tOut, 0.4));
  const op = u * (1 - v);
  it.el.style.opacity = op.toFixed(4);
  const dy = (o.dy ?? 26) * (1 - u) - v * 18;
  let tr = `translate(${o.x ?? 0}px, ${(o.y ?? 0) + dy}px)`;
  if (o.pop) tr += ` scale(${lerp(0.82, 1, backOut(prog(t, it.tIn, 0.5)))})`;
  it.el.style.transform = tr;
  it.el.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
}

function cursorAt(track, t) {
  let pos = track.startPos || (track.startPos = resolvePoint(track.start));
  for (const m of track.moves) {
    if (t < m.t0) break;
    if (t >= m.t1) { pos = m.final || m.last || resolvePoint(m.to) || pos; continue; }
    const to = resolvePoint(m.to) || m.last || pos;
    m.last = to;
    const u = ease(prog(t, m.t0, m.t1 - m.t0));
    const dx = to.x - pos.x, dy = to.y - pos.y, len = Math.hypot(dx, dy) || 1;
    const arc = Math.sin(Math.PI * u) * Math.min(70, len * 0.12);
    pos = { x: lerp(pos.x, to.x, u) + (-dy / len) * arc, y: lerp(pos.y, to.y, u) + (dx / len) * arc };
    break;
  }
  return pos;
}

const hlColors = {
  green: { line: 'rgba(47,111,79,0.95)', glow: 'rgba(47,111,79,0.22)', fill: 'rgba(47,111,79,0.07)' },
  amber: { line: 'rgba(201,138,18,0.95)', glow: 'rgba(201,138,18,0.25)', fill: 'rgba(201,138,18,0.08)' },
};
let rippleEls = [];
const measureCanvas = document.createElement('canvas').getContext('2d');

function layoutDevices(t) {
  for (const d of ['laptop', 'phone']) {
    const st = deviceState(d, t);
    const box = dev[d].box;
    box.style.transform = `translate(${st.x}px, ${st.y}px) scale(${st.s})`;
    box.style.opacity = st.o;
  }
}

function render(t) {
  layoutDevices(t);
  for (const it of items) renderItem(it, t);
  for (const f of custom) f(t);

  // highlights
  for (const h of highlights) {
    const r = t >= h.t0 - 0.01 && t <= h.t1 + 0.4 ? resolveRect(h.target) : null;
    const op = r ? easeOut(prog(t, h.t0, 0.25)) * (1 - prog(t, h.t1, 0.35)) : 0;
    h.el.style.opacity = op.toFixed(3);
    if (r && op > 0) {
      const c = hlColors[h.color];
      const s = r.s;
      h.el.style.transform = `translate(${r.x - 10 * s}px, ${r.y + 1 * s}px)`;
      h.el.style.width = `${r.w + 20 * s}px`;
      h.el.style.height = `${r.h - 2 * s}px`;
      h.el.style.borderRadius = `${10 * s}px`;
      h.el.style.border = `${Math.max(2, 3 * s)}px solid ${c.line}`;
      h.el.style.background = c.fill;
      h.el.style.boxShadow = `0 0 0 ${6 * s}px ${c.glow}`;
    }
  }

  // caret
  const caret = $('#caret');
  caret.style.opacity = 0;
  for (const c of carets) {
    if (t < c.t0 || t >= c.t1) continue;
    const el = doc(c.d).querySelector(c.sel);
    const r = stageRectOf(c.d, el);
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    measureCanvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const w = measureCanvas.measureText(el.value).width;
    const fs = parseFloat(cs.fontSize);
    const x = r.x + (parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + w + 1) * r.s;
    const h = fs * 1.2 * r.s;
    const blinkOn = t <= c.typingUntil + 0.15 || Math.floor((t - c.typingUntil - 0.15) / 0.5) % 2 === 0;
    caret.style.transform = `translate(${x}px, ${r.y + (r.h - h) / 2}px)`;
    caret.style.height = `${h}px`;
    caret.style.width = `${Math.max(1.5, 2 * r.s)}px`;
    caret.style.opacity = blinkOn ? 1 : 0;
  }

  // mouse cursor
  const cur = $('#cursor');
  let shown = false;
  for (const tr of cursorTracks) {
    if (t < tr.tIn - 0.01 || t > tr.tOut + 0.3) continue;
    const p = cursorAt(tr, t);
    if (!p) continue;
    const op = easeOut(prog(t, tr.tIn, 0.3)) * (1 - prog(t, tr.tOut, 0.3));
    let sc = 1;
    for (const c of clicks) if (c.kind === 'mouse' && t >= c.t - 0.06 && t < c.t + 0.14) sc = 0.86;
    cur.style.transform = `translate(${p.x - 2}px, ${p.y - 2}px) scale(${sc})`;
    cur.style.opacity = op.toFixed(3);
    shown = true;
  }
  if (!shown) cur.style.opacity = 0;

  // phone touch indicator
  const touch = $('#touch');
  touch.style.opacity = 0;
  for (const tp of taps) {
    if (t < tp.t - 0.45 || t > tp.t + 0.4) continue;
    const p = tp.pos || resolvePoint(tp.target);
    if (!p) continue;
    const inU = easeOut(prog(t, tp.t - 0.45, 0.3));
    const outU = prog(t, tp.t + 0.15, 0.25);
    const press = t >= tp.t - 0.05 && t < tp.t + 0.12 ? 0.82 : 1;
    const s = lerp(1.3, 1, inU) * press;
    touch.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
    touch.style.opacity = (inU * (1 - outU)).toFixed(3);
  }

  // click ripples
  let ri = 0;
  const allClicks = [...clicks, ...taps.map((x) => ({ ...x, kind: 'touch' }))];
  for (const c of allClicks) {
    const u = prog(t, c.t, 0.55);
    if (t < c.t || u >= 1) continue;
    const p = c.pos || resolvePoint(c.target);
    if (!p) continue;
    const el = rippleEls[ri++];
    const rad = lerp(8, c.kind === 'touch' ? 46 : 36, easeOut(u));
    el.style.width = el.style.height = `${rad * 2}px`;
    el.style.transform = `translate(${p.x - rad}px, ${p.y - rad}px)`;
    el.style.border = c.kind === 'touch' ? '3px solid rgba(255,255,255,0.95)' : '3px solid rgba(47,111,79,0.9)';
    el.style.opacity = ((1 - u) * 0.9).toFixed(3);
  }
  for (; ri < rippleEls.length; ri++) rippleEls[ri].style.opacity = 0;
}

// ------------------------------------------------------------------ API
function freeze(te) {
  layoutDevices(te);
  for (const c of clicks) if (c.t <= te + 1e-6 && !c.pos) c.pos = resolvePoint(c.target);
  for (const c of taps) if (c.t <= te + 1e-6 && !c.pos) c.pos = resolvePoint(c.target);
  for (const tr of cursorTracks) {
    for (const m of tr.moves) if (m.t1 <= te + 1e-6 && !m.final) m.final = resolvePoint(m.to) || m.last;
  }
}

let nextEvent = 0;
async function tick(t) {
  while (nextEvent < events.length && events[nextEvent].t <= t + 1e-6) {
    freeze(events[nextEvent].t);
    await events[nextEvent].run();
    nextEvent++;
  }
  freeze(t);
  render(t);
}

async function init() {
  TL = await (await fetch('timeline.json', { cache: 'no-store' })).json();
  for (const s of TL.scenes) {
    SC[s.id] = s;
    for (const p of s.phrases) PH[p.id] = p;
  }
  await document.fonts.ready;
  await waitLoaded('laptop');
  await waitLoaded('phone');
  const ids = [...doc('laptop').querySelectorAll('#tasks li')].map((li) => li.dataset.id).join(',');
  if (ids !== '6,4,2,1,5,3') throw new Error('unexpected seed data: ' + ids + ' (run servers.sh reset)');
  build();
  const ov = $('#overlay');
  for (const h of highlights) { h.el = document.createElement('div'); h.el.className = 'hl'; ov.appendChild(h.el); }
  for (let i = 0; i < 6; i++) { const r = document.createElement('div'); r.className = 'ripple'; ov.appendChild(r); rippleEls.push(r); }
  render(0);
  return { duration: TL.duration, fps: TL.fps, events: events.length,
    clicks: clicks.map((c) => +c.t.toFixed(3)), taps: taps.map((c) => +c.t.toFixed(3)) };
}

window.stage = { init, tick, render };
