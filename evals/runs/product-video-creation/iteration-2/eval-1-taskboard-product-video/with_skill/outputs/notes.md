# Notes: eval 1, with skill (product-video-creation)

`REPO` = `.../with_skill/repo`, `SKILL` = `plugins/factory/skills/product-video-creation`, `SCR` = my scratch folder (`scratchpad/it2/eval1-with`), `V` = `REPO/videos/taskboard`.

## Commands, in order

1. Read `SKILL/SKILL.md`, `references/script.md`, `references/engine.md`, and the engine files I had to fill in or depend on (`main.js`, `index.html`, `lines.mjs`, `flows/product.mjs`, `lib.js`, `ui/windows.js`, `styles.css`, `record.mjs`, `render.mjs`, `tts.mjs`, `voices.mjs`, `stills.mjs`, `sheet.sh`, `server.mjs`, `kokoro_tts.py`).
2. Read the product: `README.md`, `CLAUDE.md`, `docs/product.md`, `docs/requirements/001-task-list.md`, `docs/architecture/overview.md`, `docs/architecture/001-task-list.md`, `public/*`, `src/*`, `Dockerfile`, `docker-compose.yml`, `.env.example`.
3. `SKILL/scripts/check_tts.sh` → exit 0 (Kokoro ready, node and ffmpeg present). No setup or download needed.
4. `node --version` (v25.8.1), `ffmpeg -version`, `docker --version`, and `lsof` on ports 8111 and 8211 (both free).
5. `cd REPO && PORT=8111 DATA_DIR=SCR/data npm start` (background). I used the product's own `npm start` instead of `docker compose up -d`, so there was no image, volume or network to clean up and no project-name clash with parallel runs (every run's folder is called `repo`). There is no scene 2, so no real compose output was needed.
6. `curl localhost:8111/health` → ok. `cp -R SKILL/engine REPO/videos/taskboard`. In `package.json`, set `"name": "taskboard"` and `"video": { "target": [50, 80] }`. Then `npm install` and `npx playwright install chromium` (already cached, Playwright 1.63.0).
7. `node SCR/explore.mjs`: cleared and seeded the list through Taskboard's API, screenshotted it at 860 and 1100 CSS width and at phone width, and tried add, tick and an empty submit. 860 CSS in a 1200×966 window fits 7 rows with ~25 px text.
8. Checked misaki's phonemes for "Taskboard" with the Kokoro venv's python: tˈæskbɔɹd, fine, so there is no PRONOUNCE entry.
9. Wrote `outputs/questions.md`: the full draft and 3 questions, each with a default. Nobody could answer, so I continued with the defaults.
10. Wrote `V/lines.mjs`, then ran `node tts.mjs`: 13 lines, 45.2 s of speech, no casting warnings. The cast is am_michael (US m) → bf_emma (UK f) → bm_george (UK m) → af_heart narrator.
11. Font test in headless Chromium (`SCR/fonts.mjs`): Noteworthy and Bradley Hand work, so the whiteboard uses them.
12. Wrote `V/flows/product.mjs`, with seeding through the API in `prepare`. Then ran `TASKBOARD_URL=http://localhost:8111 node record.mjs product` → 28.3 s, and checked a frame sheet of the raw recording.
13. Removed scene 2 from `main.js` and `index.html`. Wrote `V/video.css`, `scenes/s1-problem.js` (the whiteboard: a wipe cued on "wipes", then "toner??" handwritten at ~4 letters/s), `scenes/s3-product.js` (a browser window showing `localhost:8080` from the README, with the clip in it) and `scenes/s4-summary.js` (the end state, cut in on the identical frame).
14. `node stills.mjs 1.5 3.4 6 10 15.56 16.56 24 32.5 43.87 44.87` + `sh sheet.sh …`, and a full-size crop for readability. Fixes: the ghosting after the wipe was still readable, so I lowered its opacity, and I moved the red note off the old writing.
15. `node render.mjs --preview` (29 s), with a frame sheet at 12 moments, including the typing.
16. Moved the pointer's resting spot into the right margin (it had rested on a Delete button, then in the bottom corner) and faded the ghosting further. Re-recorded (28.4 s), then ran `node render.mjs` (94 s) → `out/taskboard.mp4`: 56.17 s, 1920×1080, 30 fps, AAC 48 kHz stereo, inside the target (no warning).
17. Review of the final file: frames at 1.0, 3.3, 11.5, 15.56/16.56 (clip start ±0.5), 23.4 and 24.4 (typing), 26.0, 31.8, 37.9 and 43.94/44.94 (clip end ±0.5), plus `silencedetect` (speech exactly where cued, no overlaps) and the poster. The whole checklist passes.
18. Added a guard to `prepare`: it refuses to clear a list that contains anything other than the demo tasks, unless `TASKBOARD_RESET=1` is set. I tested it with `SCR/guard-test.mjs`: it passes on demo data, stops on a real task and leaves that task intact.
19. `cp V/out/taskboard.{mp4,jpg} REPO/videos/`, added the poster link under `# Taskboard` in `README.md`, and ran `cp REPO/videos/taskboard.mp4 outputs/video.mp4`.
20. `kill 68196` (my `node src/server.js`, cwd = this repo) → port 8111 free, and `rm -rf SCR`. Nothing else was touched.

## What went wrong or is worth knowing

- **Stills can't show typing inside a clip.** `stills.mjs` renders the page only, and the clip window shows the recording's first or last frame there. So the checklist's "stills at every moment of typing" can't be met with `stills.mjs` for scene 3. I checked typing on frames of the rendered preview and final instead. This is worth a line in the skill.
- **The preview size doesn't match the docs.** `render.mjs --preview` produced 1920×1080 at 15 fps, not the 960×540 its comment says. Harmless.
- **Recording is destructive.** `prepare` clears the list, and the flow's default URL is the README's `localhost:8080`, which on the office machine is the team's real Taskboard. I added the guard above. The skill could warn about this in general.
- **Scene 1 has no real footage.** It shows the status quo (a whiteboard) drawn in HTML/CSS with system handwriting fonts, since there is no real footage. It is not product-shaped and it names no invented tool, but it is the one non-recorded visual in the film.
- **Unknown office address.** The browser bar shows `localhost:8080` from the README, and the narration says "anywhere on the office network". This is question 2 in questions.md.
- **Expected exit code.** The background server task ended with exit code 143, which is my own SIGTERM.
- **Rate limit.** The run was interrupted once by an API rate limit (HTTP 429) after the README step. I resumed with no rework.
- **Not committed.** `README.md` (modified) and `videos/` (new) are left uncommitted in the product repo, since no commit was asked for. `node_modules/`, `audio/`, `out/` and `recordings/product.mp4` are git-ignored.

## Cost

- Tokens: about 209k, going by this session's token budget counter (15.00M at the start, 14.79M at the end). There is no exact per-run meter.
- Render time: preview 29 s, final 94 s. Each live recording takes about 30 s plus encoding.
