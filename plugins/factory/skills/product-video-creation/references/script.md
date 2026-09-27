# Writing the script

## Scenes

**1 · Problem.** This scene decides whether anyone keeps watching. Open on the situation, not on the product: the moment when the problem hurts. Two good patterns:
- *Voices*: two to six people say their version of the problem in one sentence each, each with a different premium voice. Use real roles (product owner, on-call engineer, team lead), not cartoon characters.
- *Status quo*: show the problem where it lives today, in the real tools people use now (the endless spreadsheet, the wiped whiteboard, the 40-step wiki page), with the narrator naming the pain.

End the scene with a single line that introduces the product as the answer, for example "Taskboard fixes exactly that." Don't use a logo explosion.

**2 · Access (optional).** Show what someone actually has to do, and nothing else: the real install commands and their real output, the sign-up page, the invitation mail, the access request. If a command is shown, run it for real first and use its real output. If access is a web flow, record it live, like scene 3. Say how long it takes, if it is short ("Two commands, and you're set."). Leave the scene out when there is nothing to do: an app on a public URL needs no scene 2.

**3 · Product.** This is the heart of the film, usually 50–70 % of the running time. For a small product it is one continuous story that solves the problem from scene 1 in the real product: realistic data, one or two key moments, and the result visible on screen. For a bigger product it is a sequence of chapters, one per capability, each a small story of its own (see *Sizing the film*). The narrator explains *why* each step matters and doesn't just read out the clicks. Leave pauses where the product speaks for itself (a result appearing, a list updating).

**4 · Summary.** Take 8–15 seconds. Repeat the problems from scene 1 as solved, in the same words, so the film closes the loop. Then give the product name and where to get it (a URL or an install command). Show the product's end state in the background, or the product's own logo on its own colours. There is no "Thank you" and no call to "revolutionize your workflow".

## Writing for the voice

Premium voices are good at conversational English and bad at text written to be read.

- **Short sentences**, 6–16 words each. One idea per sentence.
- **Contractions and plain words:** "you don't need", not "it is not necessary to".
- **Numbers the way people say them:** "twenty minutes", "version two".
- **Acronyms:** write them the way they should sound. For example `PRONOUNCE: { SQL: 'sequel', 'CLI': 'C L I' }`, or respell a name (`Pegel: 'Paygel'`). Test the unclear ones with `say -v "Zoe (Premium)" "…"`.
- **No symbols in spoken text**: no `/`, `→`, `&`, `e.g.` or URLs with paths. For "slash coordinate", write it that way in `say`.
- **Lists** of three or four items, separated by commas. `tts.mjs` pauses at every comma, so a list sounds like a list.
- **Pauses** come automatically from `tts.mjs`: 320 ms after a sentence, 220 ms after `:` and `;`, 200 ms at a dash and 140 ms at a comma. If a line needs something different, give it its own `say` with `[[slnc N]]` marks (a line that has any marks gets no automatic ones). Add a longer pause (400–600 ms) before a punchline.
- **One narrator** for the whole film. Other voices only speak as the people in scene 1, or as a character inside the product.
- Read every line out loud once, in your head. If it sounds like a slide, rewrite it.

## Sizing the film

The length follows from what the viewer has to see to understand the product, not from a fixed number:

| Product | Scene 3 | Total |
|---|---|---|
| One core flow (a to-do list, a converter, a single form) | one continuous story | 45–90 s |
| Several capabilities (a pipeline with stages, a dashboard with several views, a platform) | one chapter per capability, 30–60 s each | 2–5 min |
| More than about 5 min of material | an overview film plus a short deep dive per capability | overview 2–3 min, each deep dive 1–2 min |

- **Count capabilities, not features.** A capability is something the viewer would describe as a separate job ("it grooms requirements", "it validates the build"). Buttons and settings are not capabilities.
- **Chapters:** open each chapter with one line that ties it to the problem from scene 1, then show it. A small, plain chapter title on screen (the capability's name in the product's own words) helps viewers who skip around. The scene 1 problems are resolved one by one across the chapters, and scene 4 collects them.
- **Overview plus deep dives:** the overview is a complete four-scene film that shows each capability briefly (15–30 s each). Each deep dive is a complete short film of its own (problem, product, summary), and it names the overview in its summary.
- **The user decides:** a length the user names ("max 60 seconds") always wins. Cut capabilities rather than rush them, and say in the draft which ones you left out.
- Write the target into the project's `package.json` as `"video": { "target": [min, max] }` in seconds. `render.mjs` warns when the film falls outside it.

## Timing

- Spoken English at premium voice speed runs about 2.6 words per second. Estimate every scene from its words plus its on-screen action.
- Let the picture lead: a visual change lands on the word that names it (`cue(id, at, 'phrase')` in the engine), or 0.2–0.4 s before it.
- Typing is real time. A person types 5–9 characters per second, so a 60-character prompt takes about 9 s on screen. Keep typed text short and meaningful rather than speeding it up. While someone is typing, the narrator can say why, or stay quiet.

## Draft format to show the user

```
Product video: <Product> · size: <one story | chapters | overview + deep dives> · target <min>–<max> s · narrator Zoe (Premium)
Why this size: <capabilities counted>

1 · Problem (~15 s)
   On screen: <what is seen>
   Ava:  "…"
   Lee:  "…"
   Zoe:  "…"
2 · Access (~12 s)            ← or: skipped, <why>
   …
3 · Product (~35 s), recorded live at <url>
   <step>: <what happens>              Zoe: "…"
   (chapters: 3a <capability> (~40 s) … 3b … each with its opening line)
4 · Summary (~10 s)
   …

Open questions (only if any): 1–3, each with my default.
```
