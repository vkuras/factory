# Notes: eval-3, Kokoro not installed (with skill)

Every Bash command started with `export PVC_HOME=<run>/pvc-empty;`.

## Commands, in order

1. `ls -la <skill-dir> <skill-dir>/*`, then read `SKILL.md`, `references/engine.md`, `references/script.md`.
2. `<skill-dir>/scripts/check_tts.sh` → `Kokoro: not set up (expected in …/pvc-empty/kokoro)`, `Python for the setup: python3.12`, **exit 1**.
3. `cat <skill-dir>/scripts/setup_kokoro.sh` (read only, to describe the download exactly), `ls -la $PVC_HOME` (empty).
4. Wrote message 1 (the Kokoro install question) to `outputs/questions.md`.
5. Repo survey: `ls -la`, `git status`, `find … -type f`.
6. Read `README.md`, `CLAUDE.md`, `package.json`, `docker-compose.yml`, `Dockerfile`, `.env.example`, `docs/product.md`, `docs/requirements/001-task-list.md`, `src/*.js`, `public/*`.
7. `git remote -v` (none), `node --version` (v25.8.1), `ffmpeg -version` (9.0.2), `docker info` (28.0.4), Playwright cache (chromium-1243 present), `lsof -iTCP:8115` (free).
8. `PORT=8115 DATA_DIR=<scratchpad>/eval3/data node src/server.js &` (the product's `npm start`, data kept outside the repo), `curl /health`.
9. `curl` POST four realistic tasks, PATCH one to done, GET the list, POST a blank title (got "A title is required.").
10. Browser pane at http://localhost:8115, 1100 and 900 px wide: typed "Order toner for the printer" + Enter (appears on top), ticked "Call the printer technician" (struck through, moved below open tasks). `curl GET /api/tasks` to confirm.
11. Cleanup: Browser pane viewport reset and tab closed, `kill <server pid>`, `rm -rf <scratchpad>/eval3`. Checked: port 8115 free, `git status` clean, `$PVC_HOME` still empty.
12. `grep` of `engine/voices.mjs` to confirm the cast (af_heart, am_michael, bf_emma, bm_george).
13. Wrote `outputs/questions.md`, `outputs/final_message.md`, `outputs/notes.md`.

## Deliberately not done

- `setup_kokoro.sh` not run: the skill installs Kokoro only after the user agrees to the ~1.3 GB download, and nobody could agree in this run.
- No fallback to macOS `say` (the skill forbids it), no other TTS.
- Step 4 onwards not started (no `videos/taskboard/`, no `npm install`, no `tts.mjs`, `record.mjs` or render): recordings depend on the narration durations, so nothing could be built or checked without Kokoro. Therefore no `video.mp4`.
- The repo is unchanged, and `~/.cache/product-video` was not touched.

## What went wrong

- One Browser pane screenshot, taken right after the checkbox click, still showed the old list (the re-render came later). The API and a second screenshot confirmed the tick worked. Not a product bug.
- At 900 × 516 CSS px, five tasks overflow slightly and the page scrolls. For the recording: seed three or four tasks, or use a viewport of ~960 px.

## Token use

About 110k tokens by the session counter (15.00M → ~14.89M left), no subagents.
