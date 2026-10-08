# Writing the script

## Scenes

**1 · Problem.** This scene decides whether anyone keeps watching. Open on the situation, not on the product: the moment when the problem hurts. Two good patterns:
- *Voices*: two to six people say their version of the problem in one sentence each, each with their own voice (see *Casting*). Use real roles (product owner, on-call engineer, team lead), not cartoon characters.
- *Status quo*: show the problem where it lives today, in the real tools people use now (the endless spreadsheet, the wiped whiteboard, the 40-step wiki page), with the narrator naming the pain.

End the scene with a single line that introduces the product as the answer, for example "Taskboard fixes exactly that." Don't use a logo explosion.

**2 · Access (optional).** Show what someone actually has to do, and nothing else: the real install commands and their real output, the sign-up page, the invitation mail, the access request. If a command is shown, run it for real first and use its real output. If access is a web flow, record it live, like scene 3. Say how long it takes, if it is short ("Two commands, and you're set."). Leave the scene out when there is nothing to do: an app on a public URL needs no scene 2.

**3 · Product.** This is the heart of the film, usually 50–70 % of the running time. For a small product it is one continuous story that solves the problem from scene 1 in the real product: realistic data, one or two key moments, and the result visible on screen. For a bigger product it is a sequence of chapters, one per capability, each a small story of its own (see *Sizing the film*). The narrator explains *why* each step matters and doesn't just read out the clicks. Leave pauses where the product speaks for itself (a result appearing, a list updating).

**4 · Summary.** Take 8–15 seconds. Repeat the problems from scene 1 as solved, in the same words, so the film closes the loop. Then give the product name and where to get it (a URL or an install command). Show the product's end state in the background, or the product's own logo on its own colours. There is no "Thank you" and no call to "revolutionize your workflow".

## Writing for the voice

Kokoro sounds like a person talking when the text is something a person would say. It sounds read out when the text was written to be read.

- **Short sentences**, 6–16 words each, with one idea per sentence. Fragments are fine: "Wiped." "For everyone."
- **Contractions and plain words:** "you don't need", not "it is not necessary to". Questions and small asides ("Honestly?") give the voice its natural rise and fall.
- **Numbers the way people say them:** "twenty minutes", "version two".
- **Acronyms and names:** write them the way they should sound, for example `PRONOUNCE: { SQL: 'sequel', CLI: 'C L I', Pegel: 'Paygel' }`. For exact control, Kokoro also takes phonemes inline: `[Kokoro](/kˈOkəɹO/)`. Listen to unusual words early by running `node tts.mjs`.
- **No symbols in spoken text:** no `/`, `→`, `&`, `e.g.`, and no URLs with paths. For "slash coordinate", write it that way in `say`.
- **Lists** of three or four items, separated by commas.
- **Pauses:** Kokoro pauses at sentence and list breaks by itself, the way a speaker does. Don't cut pauses into the middle of a sentence, because that makes every fragment sound like its own sentence. For a deliberate beat, such as before a punchline or after a question the viewer should think about, give the line its own `say` with `[[slnc 400]]` to `[[slnc 600]]` at that point.
- **Speed:** leave it at 1. Use `speed: 0.9` only for a line that has to land slowly.
- Read every line out loud once, in your head. If it sounds like a slide, rewrite it.

## Casting

The narrator carries the film. The other voices speak only as the people in scene 1, or as a character inside the product. Each person has to sound like somebody else, so viewers hear several people and not one voice in costumes. Kokoro speaks two English locales, US and UK, and has female and male voices, which gives four clearly different kinds of voice. Use all four before you repeat one.

- **Narrator:** `af_heart`, Kokoro's best voice. If the user wants a male or British narrator, use `am_michael` or `bf_emma`.
- **People:** cast them in the order of `CAST` in `engine/voices.mjs`: `am_michael` (US m), `bf_emma` (UK f), `bm_george` (UK m), `af_bella` (US f), `am_fenrir` (US m), `bf_isabella` (UK f), `bm_fable` (UK m), `am_puck` (US m), `af_sarah` (US f). Each voice differs from the one before it in gender or locale.
- Two people who speak one after another never share both gender and locale. `tts.mjs` warns when they do.
- Nobody but the narrator speaks with the narrator's voice.
- Only use voices from `engine/voices.mjs`. Kokoro's other voices are graded below C by its authors and sound synthetic.
- Match the voice to the role only where it matters to the viewer. Otherwise, variety beats typecasting.

## Sizing the film

The length follows from what the viewer has to see to understand the product, not from a fixed number:

| Product | Scene 3 | Total |
|---|---|---|
| One core flow (a to-do list, a converter, a single form) | one continuous story | 45–90 s |
| Several capabilities (a pipeline with stages, a dashboard with several views, a platform) | one chapter per capability, 30–60 s each | 2–5 min |
| More than about 5 min of material | an overview film plus a short deep dive per capability | overview 2–3 min, each deep dive 1–2 min |

- **Count capabilities, not features.** A capability is something the viewer would describe as a separate job ("it grooms requirements", "it validates the build"). Buttons and settings are not capabilities.
- **Chapters:** a small, plain chapter title on screen (the capability's name in the product's own words) helps viewers who skip around. The scene 1 problems are resolved one by one across the chapters, and scene 4 collects them.
- **Overview plus deep dives:** the overview is a complete four-scene film that shows each capability briefly (15–30 s each). Each deep dive is a complete short film of its own (problem, product, summary), and it names the overview in its summary.
- **The user decides:** a length the user names ("max 60 seconds") always wins. Cut capabilities rather than rush them, and say in the draft which ones you left out.
- Write the target into the project's `package.json` as `"video": { "target": [min, max] }` in seconds. `render.mjs` warns when the film falls outside it.

## Timing

- Kokoro speaks about 3 words per second, including its natural pauses. Estimate every scene from its words plus its on-screen action.
- Let the picture lead: a visual change lands on the word that names it (`cue(id, at, 'phrase')` in the engine), or 0.2–0.4 s before it.
- Typing is real time. A person types 5–9 characters per second, so a 60-character prompt takes about 9 s on screen. Keep typed text short and meaningful rather than speeding it up. While someone is typing, the narrator can say why, or stay quiet.

## Draft format to show the user

```
Product video: <Product> · size: <one story | chapters | overview + deep dives> · target <min>–<max> s · narrator af_heart (US female)
Why this size: <capabilities counted>

1 · Problem (~15 s)
   On screen: <what is seen>
   Team lead (am_michael, US m):  "…"
   Designer (bf_emma, UK f):      "…"
   Narrator (af_heart):           "…"
2 · Access (~12 s)            ← or: skipped, <why>
   …
3 · Product (~35 s), recorded live at <url>
   <step>: <what happens>              Narrator: "…"
   (chapters: 3a <capability> (~40 s) … 3b …)
4 · Summary (~10 s)
   …

Open questions (only if any): 1–3, each with my default.
```
