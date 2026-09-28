# The engine

`engine/` is a complete video project. Copy it, then fill in `lines.mjs`, `flows/` and `scenes/`. Everything else works as it is, and this page documents all of it, so there is no need to read the engine's source files. Open one only when something behaves differently from what this page says.

| File | What it does |
|---|---|
| `lines.mjs` | every spoken line: `{ id, voice, text, say? }` plus `PRONOUNCE` |
| `tts.mjs` | Kokoro TTS (through `kokoro_tts.py`) → `audio/<id>.wav`, `durations.js/json`; prints each line with its voice and warns about miscasting. Re-renders only lines that changed |
| `voices.mjs` | the cast list: the Kokoro voices worth using, with gender, locale and grade, plus the default narrator and casting order |
| `flows/<name>.mjs` | a live, real-time session with the real product |
| `record.mjs <name>` | runs the flow in Chromium → `recordings/<name>.mp4` + cues and sounds |
| `scenes/s1…s4-*.js` | the scenes as functions of time (`sceneProblem`, `sceneAccess`, `sceneProduct`, `sceneSummary`) |
| `main.js` | chains the scenes. Remove `sceneAccess` here and in `index.html` when there is no scene 2 |
| `stills.mjs t…` / `sheet.sh t…` | `out/still-<t>.png` / a contact sheet, for checking |
| `render.mjs [--preview]` | `out/<package name>.mp4` (1080p30) plus a poster `out/<name>.jpg` |

Order: `node tts.mjs` → `node record.mjs product` → write the scenes → stills → `node render.mjs --preview` → `node render.mjs`. After changing lines, run `tts.mjs` and then `record.mjs` again, because recordings wait for the narration and depend on its durations.

## Live recordings (scene 3, and any web flow in scene 2)

```js
// flows/product.mjs
export const options = {
  url: 'http://localhost:8080',          // loaded before the first frame
  size: { w: 1600, h: 918 },             // the box the clip fills on the stage (default 1920×1080)
  viewport: { width: 1100 },             // CSS width the product is laid out at: narrower = bigger UI
  prepare: async (page) => { /* reset data, seed realistic records, log in, close banners */ },
};
export default async function flow(p) {
  await p.say('s3_add');                                  // narration starts now (never overlaps the previous line)
  await p.type('Order coffee beans', { target: '#title' }); // pointer travels, clicks, types at human speed
  await p.press('Enter');
  await p.settle();                                       // hold until the line has been spoken
  await p.say('s3_done');
  await p.click('li:first-child input[type=checkbox]');
  await p.settle();
}
```

The flow API has these calls: `say(id)`, `settle(extra?)`, `wait(s)`, `move(target)`, `hover(target)`, `click(target)`, `type(text, { target?, typo? })`, `press(key)`, `scroll(dy)`, `goto(url)`, `now()`, and `page` for any Playwright call. A target is a CSS selector, a Playwright locator or `[x, y]`.

- **Start from a known state.** Use `prepare` to reset the data through the product's own API or UI and seed it with realistic records (real-sounding names, plausible numbers). A demo on an empty screen shows nothing, and leftovers from an earlier run show duplicates.
- **Size it to be readable.** Choose `viewport.width` so that the product's content fills the box. A narrow app like a to-do list looks good at 900–1100, a dashboard at 1280–1440. Look at a still before you render.
- **Keep the pacing real.** Never speed up typing or skip steps with `page.fill`. If something is too slow to watch (a long build, a slow import), cut it into two recordings with a scene cut in between, and say so in the narration ("A minute later…").
- **Only the real product.** When a flow crosses into another real tool (sign-in via Keycloak, a GitLab page), record that too if it is reachable. Otherwise show a real screenshot of it. Never rebuild it in HTML.
- To show the product inside a browser window, put `browserWin(url, rect)` on the stage and pass its `.box` and `.body` to `clip()`. Set `options.size` in the flow to the same `w`/`h` (`rect.h - 42`).

## Terminal scenes

A terminal has to be readable on a phone screen. Make the window fill most of the frame (at least 1400 × 800), use a font of at least 26 px, and push in with `camTo` when the output gets long. Before you show a command, run it for real and paste its output unchanged, shortening only repeated progress lines. If the real run needed different values (a port, a project name), use the values a new user would see, taken from the README.

## Scenes

A scene is a function `(stage, t0) → end time`. Everything visible is a pure function of time, so the renderer can seek to any frame:

```js
function sceneProduct(stage, t0) {
  const S = $(`<section class="scene" style="background:#e9e9e7"></section>`);
  stage.appendChild(S);
  const W = browserWin('https://taskboard.example.com', { x: 160, y: 60, w: 1600, h: 960 });
  S.appendChild(W.el);
  const end = clip('product', t0 + 0.6, W.box, W.body) + 0.4; // narration and key sounds come with the clip;
                                                             // W.body shows its first/last frame around it
  sceneSpan(S, t0, end);
  return end;
}
```

These are the building blocks in `lib.js` and `ui/windows.js`:

| Call | Use |
|---|---|
| `say(id, at)` → end | place a line; returns the time it ends |
| `cue(id, at, 'phrase')` → t | the moment a phrase is spoken inside a line; hang visual changes on it |
| `clip(name, at, box?, holder?)` → end | a live recording on the stage. Pass the window body as `holder`, so the window shows the product (first and last frame) around the clip instead of being empty |
| `typeInto(field(el), text, at, opts)` → end | human, real-time typing into stage elements (e.g. a real terminal command in scene 2). `speed` is capped at 1 |
| `caret(el, from, to, typingUntil)` | blinking caret |
| `macWin(cls, title, rect)`, `browserWin(url, rect)` | macOS window chrome, `cls`: `term`, `term dark`, `web` |
| `feed(container).add(el, at)` | lines that appear in order, such as terminal output |
| `showBetween(el, from, to)`, `sceneSpan(S, from, to)` | visibility and crossfades |
| `Pointer.show(a, b).at(t, target).click(t)` | pointer on stage scenes (recordings bring their own) |
| `camTo(cam, at, d, scale, fx, fy)` | a slow push-in on a detail. Use it rarely and gently |
| `caption(stage, html, at, to)` | a plain lower third. Use it rarely |
| `sfx(name, at)` | `key`, `bs`, `enter`, `click`, `pop`, `tick`, `ding` (`whoosh` and `boom` exist, but are part of the AI look) |
| `V.tl` | the GSAP timeline, for tweens at absolute times |

## The look

The film should look as if a careful person recorded their Mac, not like a generated presentation.

**Do:**
- Take colours and type from the product itself: its background, its accent and its font. The stage background is a quiet neutral (`#e9e9e7`, `#f5f5f4`, or the product's own dark background), and there is one accent at most.
- Use real chrome: macOS windows, Terminal.app, a browser URL bar showing the real address, and the real names of the real tools (GitLab, Jira, Slack, Keycloak, VS Code, whatever the product actually touches).
- Show real output: run install commands and paste their actual output. Take screenshots of the real tools in scene 1.
- Keep motion calm: cuts and 0.3–0.5 s crossfades, slow push-ins at most, and a pointer that moves like a hand.
- Use plain text when text is needed: system font, sentence case, left-aligned, few words.

**Don't:**
- dark navy or purple gradients, glow, grain, vignettes, glassmorphism or neon accent bars
- rounded "cards" with pill badges, emoji, icons that stand in for real software, or stat counters ("10× faster")
- title slides with bullet points, a logo that explodes in, kinetic typography or word-by-word captions of the narration
- invented tools, invented UIs, mockups of the product, or fake data that looks fake ("John Doe", "Lorem", "Test 123")
- typing that is faster than a person types, or text that appears all at once where someone is typing
