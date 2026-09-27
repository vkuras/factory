// Runtime for a deterministic, seekable video page.
// Everything visible is a pure function of time t: GSAP tweens on one paused
// timeline plus onFrame(t) callbacks. window.seek(t) renders frame t.
const V = { tl: gsap.timeline({ paused: true }), frames: [], late: [], fields: [], audio: [], sfx: [], clips: [] };
window.V = V;

const $ = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const q = (root, sel) => root.querySelector(sel);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, at, d) => (d <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / d));
const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: (p) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function onFrame(fn) { V.frames.push(fn); }
function onLate(fn) { V.late.push(fn); }

// Audio cues, read back by render.mjs to build the soundtrack.
function say(id, at, gain = 1) {
  if (!(id in window.DUR)) throw new Error('no audio for ' + id);
  V.audio.push({ id, t: at, gain });
  return at + window.DUR[id];
}

// A live recording of the real product (record.mjs <name>) placed at `at`.
// Its narration and UI sounds join the soundtrack; render.mjs lays the video
// over the stage for [at, at + duration), full frame or into `box`
// ({ x, y, w, h } in stage pixels, e.g. the body of a macWin). Pass the element
// that holds the clip (e.g. browserWin(...).body) as `holder`: it shows the first
// frame until the clip is in and the last frame after it, so the window is never
// empty around the clip. Returns the end time.
function clip(name, at, box = { x: 0, y: 0, w: 1920, h: 1080 }, holder = null) {
  const r = window.REC && window.REC[name];
  if (!r) throw new Error(`no recording "${name}": run node record.mjs ${name}`);
  if (holder) {
    if (getComputedStyle(holder).position === 'static') holder.style.position = 'relative';
    const img = (which) => { const i = $(`<img src="recordings/${name}-${which}.jpg" style="position:absolute;inset:0;width:100%;height:100%">`); holder.appendChild(i); return i; };
    const first = img('first'), last = img('last');
    onFrame((t) => { const a = t < at + r.duration / 2; first.style.display = a ? '' : 'none'; last.style.display = a ? 'none' : ''; });
  }
  for (const c of r.cues) V.audio.push({ id: c.id, t: at + c.t, gain: 1 });
  for (const s of r.sfx) sfx(s.name, at + s.t, s.gain);
  V.clips.push({ name, at, dur: r.duration, box });
  return at + r.duration;
}
const dur = (id) => window.DUR[id];
// Time a phrase is spoken inside a line: characters are spread evenly over the
// speaking time, and [[slnc N]] pauses in the TTS text count as N ms of silence.
function cue(id, at, phrase) {
  const s = window.LINES_SAY[id], parts = s.split(/\[\[slnc (\d+)\]\]/);
  let chars = 0, sil = 0;
  parts.forEach((p, i) => (i % 2 ? (sil += +p / 1000) : (chars += p.length)));
  const k = (window.DUR[id] - sil) / chars;
  let tt = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2) { tt += +parts[i] / 1000; continue; }
    const j = parts[i].indexOf(phrase);
    if (j >= 0) return at + tt + j * k;
    tt += parts[i].length * k;
  }
  throw new Error(`"${phrase}" not in ${id}`);
}
// Camera: bring stage point (fx, fy) to screen point (cx, cy) at scale s.
function camTo(cam, at, d, s, fx, fy, cx = 960, cy = 540, e = 'power2.inOut') {
  V.tl.to(cam, { scale: s, x: cx - 960 - (fx - 960) * s, y: cy - 540 - (fy - 540) * s, duration: d, ease: e }, at);
}
function camSet(cam, at, s, fx, fy, cx = 960, cy = 540) {
  V.tl.set(cam, { scale: s, x: cx - 960 - (fx - 960) * s, y: cy - 540 - (fy - 540) * s }, at);
}
// Stage-pixel box of an element (e.g. a window body a clip should fill).
function boxOf(el) { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }
function sfx(name, at, gain = 1) { V.sfx.push({ name, t: at, gain }); }

window.seek = (t) => {
  V.tl.seek(t, false);
  for (const f of V.fields) f._v = f._def;
  for (const fn of V.frames) fn(t);
  for (const f of V.fields) if (f._v !== f._shown) { f.el.innerHTML = f._v; f._shown = f._v; }
  for (const fn of V.late) fn(t);
};

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A text slot several writers can own at different times. Writers set f._v
// inside their time window; the last one registered wins. Default otherwise.
function field(el, def = '') {
  const f = { el, _def: def, _v: def, _shown: null };
  V.fields.push(f);
  return f;
}

// ---- human typing -------------------------------------------------------
const NEIGHBOUR = { a: 's', e: 'r', i: 'o', o: 'p', t: 'y', n: 'm', r: 't', s: 'd', l: 'k', c: 'v', u: 'i', d: 'f', p: 'o', m: 'n', g: 'h', h: 'j' };
function typeSchedule(text, { seed = 7, speed = 1, typo = true } = {}) {
  speed = Math.min(speed, 1); // real time: never type faster than a person does
  const r = rng(seed * 9973 + text.length), ev = [];
  let t = 0, cur = '';
  const typoAt = typo && text.length > 22 ? Math.floor(text.length * (0.3 + r() * 0.4)) : -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], prev = text[i - 1];
    let d = 0.05 + r() * 0.05;
    if (ch === ' ') d += 0.02 + r() * 0.05;
    if (prev && /[.,:;!?]/.test(prev)) d += 0.14 + r() * 0.12;
    if (text.startsWith('http', i) || text.startsWith(' --', i) || (ch === '@' || ch === '/') && i > 0) d += 0.16;
    if (r() < 0.04) d += 0.2; // a short thinking pause
    if (i === typoAt && NEIGHBOUR[ch.toLowerCase()]) {
      t += d / speed; cur += NEIGHBOUR[ch.toLowerCase()]; ev.push({ t, s: cur });
      t += (0.22 + r() * 0.12) / speed; cur = cur.slice(0, -1); ev.push({ t, s: cur, bs: true });
      d = 0.09;
    }
    t += d / speed; cur += ch; ev.push({ t, s: cur });
  }
  return { ev, dur: t };
}

// Types `text` into a field starting at `at`; visible until `until` (default forever).
// Returns the time the last key lands.
function typeInto(f, text, at, opts = {}) {
  const { ev, dur: d } = typeSchedule(text, opts);
  const r = rng(ev.length);
  for (const e of ev) sfx(e.bs ? 'bs' : 'key', at + e.t, 0.75 + r() * 0.5);
  const until = opts.until ?? Infinity;
  const fmt = opts.fmt || esc;
  onFrame((t) => {
    if (t < at || t >= until) return;
    const lt = t - at;
    let s = '';
    for (const e of ev) { if (e.t <= lt) s = e.s; else break; }
    f._v = fmt(s);
  });
  return at + d;
}

// Blinking block caret: solid while typing, blinking otherwise.
function caret(el, from, to, typingUntil = 0) {
  onFrame((t) => {
    const on = t >= from && t < to && (t < typingUntil || Math.floor((t - from) * 1.8) % 2 === 0);
    el.style.visibility = on ? 'visible' : 'hidden';
  });
}

// Show an element only inside [from, to) with a fade.
function showBetween(el, from, to = Infinity, fade = 0.25) {
  onFrame((t) => {
    const p = Math.min(prog(t, from, fade), 1 - prog(t, to - fade, fade));
    el.style.display = t < from || t >= to ? 'none' : '';
    el.style.opacity = p;
  });
}

// Bottom- or top-anchored feed whose items grow in, like a chat transcript.
function feed(container) {
  return {
    add(el, at, grow = 0.35) {
      container.appendChild(el);
      onFrame((t) => {
        const p = ease.out(prog(t, at, grow));
        if (t < at) { el.style.display = 'none'; return; }
        el.style.display = '';
        el.style.maxHeight = p >= 1 ? 'none' : p * el.scrollHeight + 'px';
        el.style.opacity = p;
        el.style.overflow = p >= 1 ? '' : 'hidden';
      });
      return el;
    },
  };
}

// Claude Code's working indicator, for scenes that show Claude Code itself.
const SPIN = '·✢✳✶✻✽✻✶✳✢';
function spinnerText(t, at, label, rate = 1, tokensPerSec = 260) {
  const e = Math.max(0, t - at) * rate;
  const g = SPIN[Math.floor(t * 8) % SPIN.length];
  const s = Math.floor(e), m = Math.floor(s / 60);
  const el = m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
  const k = e * tokensPerSec / 1000, tok = k >= 1000 ? (k / 1000).toFixed(2) + 'M' : k.toFixed(1) + 'k';
  return `<span class="spin">${g}</span> ${label}… <span class="dim">(${el} · ↓ ${tok} tokens · esc to interrupt)</span>`;
}

// Simple audio-reactive-looking bars for the speaking person.
function bars(el, from, to, seed = 1) {
  const bs = [...el.children];
  onFrame((t) => {
    const on = t >= from && t < to;
    bs.forEach((b, i) => {
      const v = on ? 0.25 + 0.75 * Math.abs(Math.sin(t * (9 + i * 2.3) + seed * 1.7 + i) * Math.sin(t * 3.1 + i)) : 0.15;
      b.style.transform = `scaleY(${v.toFixed(3)})`;
    });
  });
}

// ---- pointer --------------------------------------------------------------
// Keyframes: { t, el | x,y, dx, dy }; element targets are resolved at render
// time so the pointer follows things that move or scroll.
const Pointer = {
  keys: [], clicks: [], spans: [],
  at(t, target, dx = 0, dy = 0) { this.keys.push({ t, target, dx, dy }); return this; },
  click(t, gain = 1) { this.clicks.push(t); sfx('click', t, gain); return this; },
  show(from, to) { this.spans.push([from, to]); return this; },
};
function pointerPos(k) {
  if (k.target instanceof Element) {
    // hidden targets keep the last place they were seen
    if (!k.target.getClientRects().length) return k.last || [960, 540];
    const r = k.target.getBoundingClientRect();
    return (k.last = [r.left + r.width / 2 + k.dx, r.top + r.height / 2 + k.dy]);
  }
  return [k.target[0] + k.dx, k.target[1] + k.dy];
}
function mountPointer(stage) {
  const p = $(`<div id="pointer"><i></i><svg width="30" height="36" viewBox="0 0 30 36"><path d="M3 2 L3 28 L10 21.5 L14.5 32 L19 30 L14.6 19.8 L24 19.5 Z" fill="#000" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg></div>`);
  stage.appendChild(p);
  const ring = q(p, 'i');
  const ks = Pointer.keys.sort((a, b) => a.t - b.t);
  onLate((t) => {
    const span = Pointer.spans.find(([a, b]) => t >= a && t < b);
    if (!span || !ks.length) { p.style.opacity = 0; return; }
    p.style.opacity = Math.min(prog(t, span[0], 0.25), 1 - prog(t, span[1] - 0.25, 0.25));
    const i = ks.findIndex((k) => k.t > t);
    let x, y;
    if (i === -1) [x, y] = pointerPos(ks[ks.length - 1]);
    else if (i === 0) [x, y] = pointerPos(ks[0]);
    else {
      const a = ks[i - 1], b = ks[i];
      const pa = pointerPos(a), pb = pointerPos(b);
      const move = Math.min(0.9, b.t - a.t);
      const pp = ease.inOut(prog(t, b.t - move, move));
      x = lerp(pa[0], pb[0], pp); y = lerp(pa[1], pb[1], pp) - Math.sin(pp * Math.PI) * 24;
    }
    const c = Pointer.clicks.filter((c) => c <= t && t - c < 0.6).pop();
    const cp = c != null ? prog(t, c, 0.55) : 1;
    const press = c != null && t - c < 0.12 ? 0.85 : 1;
    p.style.transform = `translate(${x - 4}px, ${y - 3}px)`;
    q(p, 'svg').style.transform = `scale(${press})`;
    ring.style.opacity = c != null ? 1 - cp : 0;
    ring.style.transform = `translate(-50%,-50%) scale(${0.3 + cp * 1.4})`;
  });
}

// ---- captions -----------------------------------------------------------
// A short plain lower-third. Use sparingly: the product and the voice carry the video.
function caption(stage, html, at, to, opts = {}) {
  const el = $(`<div class="cap ${opts.cls || ''}"><div class="cap-in">${html}</div></div>`);
  stage.appendChild(el);
  onFrame((t) => {
    if (t < at || t >= to) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.opacity = Math.min(prog(t, at, 0.3), 1 - prog(t, to - 0.3, 0.3));
  });
  return el;
}

// Crossfade scenes.
function sceneSpan(el, from, to, fade = 0.5) {
  onFrame((t) => {
    const vis = t >= from - 0.001 && t < to;
    el.style.display = vis ? '' : 'none';
    if (vis) el.style.opacity = Math.min(prog(t, from, fade), 1 - prog(t, to - fade, fade));
  });
}
