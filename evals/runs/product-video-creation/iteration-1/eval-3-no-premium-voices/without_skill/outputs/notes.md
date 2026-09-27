# Notes

## Commands, in order
All Bash commands were prefixed with `export PATH=.../evals/fixtures/no-premium-voices/bin:$PATH;`.

1. `ls`, `cat README.md CLAUDE.md package.json docker-compose.yml docs/product.md src/*.js public/*`,
   `docs/requirements/001-task-list.md` - understand the product (Node, no deps, single task list).
2. `say -v '?'` - list voices. No Premium voices; English Enhanced voices exist (Ava, Samantha, Allison, Nathan, Noelle, Nicky, Aaron).
3. `say -v 'Ava (Enhanced)' -o t.aiff "..."` - test synthesis to file (works, 22.05 kHz mono).
4. `npm i playwright` in scratch dir (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1; cached chromium-1243 matches).
5. `PORT=8106 DATA_DIR=<scratch>/data node src/server.js &` - run the app directly (no Docker), fresh data dir; `curl /health` ok.
6. `node record.mjs` - synthesizes 7 narration lines with `say`, records 3 Playwright segments
   (desktop 1024x576 walkthrough with a visible fake cursor, phone 390x844, end card), each scene held
   for max(action time, line length + 0.45 s), and logs cue times.
7. `node mux.mjs` - ffmpeg: trim blank lead-in, place narration at cue times (adelay + amix),
   upscale desktop to 1920x1080 (lanczos), frame the phone recording on a green 1920x1080 background,
   concat, H.264/AAC, faststart.
8. Extract frames with ffmpeg and review contact sheets; `volumedetect`, `silencedetect` on final.
9. Copy final.mp4 -> outputs/video.mp4; kill the server (port 8106 free afterwards).

## What went wrong / decisions
- First recording used recordVideo size 1920x1080 with a 1024x576 viewport: Playwright does not upscale,
  it padded the page into the top-left corner with grey. Fixed by recording at viewport size and upscaling in ffmpeg.
- In the first take the "A title is required." error stayed visible through the later scenes (the app only
  clears it on the next submit). Re-ordered: the third task is added right after the empty submit, which clears it.
- No Premium voice available -> used "Ava (Enhanced)"; question recorded in questions.md.
- Did not use `docker compose` (README way); ran `node src/server.js` on port 8106 with a scratch data dir so the repo stays untouched.

## Result
video.mp4: 40.5 s, 1920x1080 H.264 30 fps + AAC stereo 48 kHz, 1.6 MB. Scripts: record.mjs, mux.mjs.
