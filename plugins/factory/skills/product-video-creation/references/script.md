# Writing the script

## Scenes

**1 · Problem.** This scene decides whether anyone keeps watching. Open on the situation, not on the product: the moment when the problem hurts. Two good patterns:
- *Voices*: two to six people say their version of the problem in one sentence each, each with a different premium voice. Use real roles (product owner, on-call engineer, team lead), not cartoon characters.
- *Status quo*: show the problem where it lives today, in the real tools people use now (the endless spreadsheet, the wiped whiteboard, the 40-step wiki page), with the narrator naming the pain.

End the scene with a single line that introduces the product as the answer, for example "Taskboard fixes exactly that." Don't use a logo explosion.

**2 · Access (optional).** Show what someone actually has to do, and nothing else: the real install commands and their real output, the sign-up page, the invitation mail, the access request. If a command is shown, run it for real first and use its real output. If access is a web flow, record it live, like scene 3. Say how long it takes, if it is short ("Two commands, and you're set."). Leave the scene out when there is nothing to do: an app on a public URL needs no scene 2.

**3 · Product.** This is the heart of the film, usually 40–60 % of the running time. It is one continuous story that solves the problem from scene 1 in the real product: realistic data, one or two key moments, and the result visible on screen. The narrator explains *why* each step matters and doesn't just read out the clicks. Leave pauses where the product speaks for itself (a result appearing, a list updating).

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

## Timing

- Aim for 45–120 s in total. Spoken English at premium voice speed runs about 2.6 words per second.
- Let the picture lead: a visual change lands on the word that names it (`cue(id, at, 'phrase')` in the engine), or 0.2–0.4 s before it.
- Typing is real time. A person types 5–9 characters per second, so a 60-character prompt takes about 9 s on screen. Keep typed text short and meaningful rather than speeding it up. While someone is typing, the narrator can say why, or stay quiet.

## Draft format to show the user

```
Product video: <Product> · ~75 s · narrator Zoe (Premium)

1 · Problem (~15 s)
   On screen: <what is seen>
   Ava:  "…"
   Lee:  "…"
   Zoe:  "…"
2 · Access (~12 s)            ← or: skipped, <why>
   …
3 · Product (~35 s), recorded live at <url>
   <step>: <what happens>              Zoe: "…"
4 · Summary (~10 s)
   …

Open questions (only if any): 1–3, each with my default.
```
