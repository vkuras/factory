// App chrome and small interactive widgets shared by the scenes.
function macWin(cls, title, { x, y, w, h }, extraBar = '') {
  const el = $(`<div class="win ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div class="bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="ttl">${title}</span>${extraBar}</div>
    <div class="body"></div></div>`);
  return { el, body: q(el, '.body') };
}

// A vertical menu whose highlight follows a list of { t, i } key events.
// items: strings (html). Returns the element; `pick` events flash the row.
function menu(items, events, { prefix = '❯ ', cls = 'menu' } = {}) {
  const el = $(`<div class="${cls}">${items.map((it) => `<div><span class="pf"></span>${it}</div>`).join('')}</div>`);
  const rows = [...el.children];
  for (const e of events) if (!e.silent) sfx(e.enter ? 'enter' : 'key', e.t, e.enter ? 1 : 0.9);
  onFrame((t) => {
    let i = 0;
    for (const e of events) if (e.t <= t && e.i != null) i = e.i;
    rows.forEach((r, k) => { r.classList.toggle('sel', k === i); r.firstChild.textContent = k === i ? prefix : ' '.repeat(prefix.length); });
  });
  return el;
}

// Key events stepping a highlight from `from` down to `to`, then Enter.
function steps(t, from, to, gap = 0.32) {
  const ev = [{ t: t - 0.001, i: from, silent: true }];
  let i = from;
  while (i < to) { t += gap; i++; ev.push({ t, i }); }
  t += gap + 0.1;
  ev.push({ t, enter: true });
  return { ev, t };
}

// A browser window around a live recording: the URL bar shows the product's
// real address. Record the flow with options.size = the returned box.
// const W = browserWin('http://localhost:8080', { x: 160, y: 60, w: 1600, h: 960 }); stage.appendChild(W.el);
// clip('product', at, W.box, W.body)
function browserWin(url, rect) {
  const w = macWin('web', '', rect, `<div class="url">${esc(url.replace(/^https?:\/\//, ''))}</div>`);
  return { ...w, box: { x: rect.x, y: rect.y + 42, w: rect.w, h: rect.h - 42 } };
}
