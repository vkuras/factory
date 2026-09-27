---
name: product-video-creation
description: Makes a narrated product video (1080p MP4) for a real product, from its repo and the running app. It checks the macOS premium voices, drafts a four-scene script (the problem, how to get access, the real product in use, what it solves), records the live product in real time and renders everything with natural premium voiceover. Use this whenever the user wants a product video, demo video, explainer, promo clip, walkthrough, launch video, screencast with voiceover or "a video that shows what X does", even if they only say "mach ein Video von der App", "zeig das Produkt in einem Video", "record a demo" or "wir brauchen ein Video für das Release". Do not use it for editing footage the user already has, for slide decks, or for GIFs of a single UI bug.
---

# Product video creation

You make a short film that shows a real product solving a real problem. It is narrated by macOS premium voices, and scene 3 is the real product, recorded while it runs.

The film fails in three ways, and each one is easy to fall into:

1. **It looks made by an AI.** Dark navy gradients, neon accent bars, glassy cards, pill badges, emoji, a logo that bursts in with a whoosh, big kinetic captions over everything. Viewers have seen that look a thousand times, and it tells them nobody real made this. The film should look like a person recorded their screen well: the product's own colours, real windows, plain type, restraint.
2. **It shows a fake product.** An HTML mockup of the app, invented numbers, a made-up tool. The moment a viewer spots a fake, they stop believing the rest. Show the actual product and the actual tools around it: the real app recorded live, real terminal output, real names of the tools involved.
3. **It sounds like a machine.** Premium voices sound human only when the script is written for speaking and has room to breathe: short sentences, pauses at sentence and list breaks, no acronyms spelled into mush, and typing that happens at the speed a person types.

## Workflow

### 1. Check the voices and tools

```bash
<skill-dir>/scripts/check_voices.sh
```

The script lists the English premium voices and checks for `node` and `ffmpeg`.

- **Exit 1, no premium voice installed:** stop and ask the user to install them, and do nothing else until they confirm. Standard and "Enhanced" voices are what make a video sound like a machine, so never fall back to them. Give them the steps as written here:
  > System Settings → Accessibility → Spoken Content → click **ⓘ** next to *System voice* → **Voice** → search for **Premium** → download all of the English premium voices. Tell me when the downloads have finished.

  Then run the check again.
- **Exit 2, a tool is missing:** tell the user which tool it is (`brew install ffmpeg`, or Node 20+), and continue once it is installed.
- **Exit 0:** note which voices are there. The narrator is usually Zoe or Ava. Other voices can speak for the people in scene 1.

### 2. Understand the product without an interview

The user wants a good film, not a questionnaire. Find the answers yourself before you ask anything:

- **The problem, the audience and the product's name:** read `README*`, `docs/product.md`, `docs/requirements/`, the landing page and the release notes.
- **Getting access:** read the install instructions, `docker-compose.yml`, `package.json` scripts, the plugin or marketplace manifests and the sign-in setup.
- **The flow worth showing:** start the product (use its own run command, for example `docker compose up -d` or `npm start`) and open it with Playwright. Click through it and take screenshots. Find the one path that takes a viewer from the problem to the result in under a minute, using realistic data. If the product cannot run locally, look for a staging URL in the docs.
- **Names to pronounce:** product names, tools and acronyms. Test anything unusual with `say -v "Zoe (Premium)" "…"`.

Ask the user only what you cannot find out, and ask it together with the script in step 3.

Clean up after yourself, but only what you started: stop your own servers and your own compose project (`docker compose -p <yours> down`). Never prune images, volumes or containers you didn't create, because they belong to the user.

### 3. Draft the script and get one approval

Read `references/script.md` before you write the script. It covers the scene rules, writing for the voice and the timing.

Every film uses this structure:

| Scene | Required | Content |
|---|---|---|
| 1 · Problem | always | Makes clear which problem the product solves: the situation, in the words of the people who have it, shown where it happens today |
| 2 · Access | optional | What someone has to do to get it: install, onboarding, sign-up or getting access. Skip it when there is nothing to do |
| 3 · Product | always | The real product, recorded live, solving the problem from scene 1 |
| 4 · Summary | always | A quick summary of what it solves, and where to get it |

Show the user the whole draft in one message: each scene with its spoken lines, which voice speaks them, what is on screen and the estimated length. Then ask for approval in a single round of **at most three** questions, and only about what you could not work out yourself (for example a staging URL, or which of two flows matters more). Make your draft the default, so that "looks good" is a complete answer. If the user has said to just do it, or nobody is there to answer, go ahead with the draft and list your assumptions in the final message.

### 4. Build the film

Read `references/engine.md` for the engine API and the look rules. In short:

1. Copy `<skill-dir>/engine/` to `videos/<product-slug>/` in the product's repo, and set `"name"` in its `package.json` to the slug. Run `npm install` and `npx playwright install chromium`. All product videos live under `videos/`, so a team finds every one of them in one place.
2. Write `lines.mjs`, then run `node tts.mjs` and read its output. Every line is printed with the pauses it will get and its duration.
3. Write `flows/product.mjs` and run `node record.mjs product`, then do the same for any other live recording. The product has to be running.
4. Write the scene files in `scenes/`. Scene 3 is mostly `clip('product', t)`.
5. Check the stills (`node stills.mjs …`) and the preview (`node render.mjs --preview`), then run the final `node render.mjs`.

### 5. Review before you deliver

Watch your own output before the user does. Extract stills at every scene and at every moment of typing (`node stills.mjs t1 t2 …`, and `sh sheet.sh …` for a contact sheet), look at them, and go through this list:

- [ ] Scene 1 names the problem within its first two lines, and a viewer who has the problem would recognise it.
- [ ] Everything product-shaped on screen is the real product or real output. There are no mockups and no invented tools.
- [ ] Nothing on screen has the AI look described above.
- [ ] Typing runs at human speed: no `speed` above 1, and no text that appears all at once where someone is supposed to type it.
- [ ] No voice overlaps another. Every line has its pauses (check the `tts.mjs` printout), and no premium voice is missing.
- [ ] Scene 4 repeats the problem from scene 1 as solved, and says where to get the product.
- [ ] The total length is 45–120 s, unless the user asked for something else.
- [ ] Scene 3 and any terminal are sized so that their text is readable (look at a full-size still).
- [ ] No window is empty or white at a scene transition. Take stills 0.5 s before and after every clip.

Fix whatever fails, then render again.

### 6. Put it in the repo and the README

Copy `out/<slug>.mp4` and the poster `out/<slug>.jpg` to `videos/<slug>.mp4` and `videos/<slug>.jpg`. The render output under `out/` is not tracked, but these two files are.

The video is the first thing a reader sees. Put it in `README.md` directly under the first `#` headline, before any other text:

```markdown
# <Product>

[![<Product> in 90 seconds: watch the product video](videos/<slug>.jpg)](videos/<slug>.mp4)
```

A poster image that links to the MP4 works on GitHub and GitLab alike. If the README already has a product video at that spot, replace it.

### 7. Deliver

Send the MP4 with `SendUserFile` so the user can watch it right away, and give its path. Add two or three lines on what the film shows, any assumptions you made, and the commands to change it: edit `lines.mjs` → `node tts.mjs` → `node record.mjs product` → `node render.mjs`.
