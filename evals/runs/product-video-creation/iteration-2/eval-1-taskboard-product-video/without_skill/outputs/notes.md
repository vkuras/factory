# Notes: Taskboard product video

`$REPO` = `.../eval-1-taskboard-product-video/without_skill/repo`
`$SCR` = `/private/tmp/claude-501/-Users-vicokuras-IdeaProjects-factory/3124295b-efe7-4312-9c32-b91efffec513/scratchpad/it2/eval1-without`

## Commands, in order

1. Explored the product (read only):
   `ls -la $REPO`, `git log`, `find . -type f`, then `cat README.md CLAUDE.md package.json .env.example Dockerfile docker-compose.yml docs/product.md docs/requirements/001-task-list.md docs/architecture/*.md docs/implementation/001-task-list.md docs/validation/001-task-list.md public/* src/*`.
2. Checked the tooling:
   `which node npx ffmpeg ffprobe python3.12 docker say`, `ls ~/Library/Caches/ms-playwright`, `npm ls -g`, `python3.12 -c "import playwright"` (not installed), `say -v '?'` (found "Ava (Premium)").
3. `cd $REPO && npm test`: 10 of 10 unit tests pass. `lsof` confirmed that ports 8112 and 8212 were free.
4. Wrote `outputs/questions.md` (the questions I would ask first) and continued with the defaults listed there.
5. Wrote the helper scripts in `$SCR/tools/`: `stage-server.mjs` (serves the stage page on 8212 and proxies everything else to the app on 8112, so the stage and the app share one origin), `servers.sh` (start, stop, reset), `cdp.mjs` (a minimal Chrome DevTools client over `--remote-debugging-pipe`) and `shot.mjs`.
6. `$SCR/tools/servers.sh reset`: runs `PORT=8112 DATA_DIR=$SCR/data node $REPO/src/server.js` and the stage proxy, wipes the demo data, and seeds six tasks through the product's own API (`POST /api/tasks`, and `PATCH /api/tasks/:id` for the two done ones).
7. `node shot.mjs http://127.0.0.1:8212/ app-laptop.png 1100 760` and the same at `390 844 2 mobile`: reference screenshots of the real UI.
8. Wrote the narration script (`tools/script.json`: 9 scenes, 21 phrases), then `node tools/narrate.mjs`. For each phrase it runs `say -v "Ava (Premium)" -r 172 -o <id>.aiff`, trims the silence with ffmpeg `silenceremove`, resamples to 48 kHz and measures the length. It writes `stage/timeline.json` (78.6 s) and `captions.srt`.
9. Wrote the stage (`stage/index.html` and `stage/stage.js`). It holds a browser-window mockup and a phone mockup, each embedding the real app in an iframe. The text panel, cursor, taps, highlights and scene moves are all pure functions of a virtual clock. App actions (focus, type, Add task, tick, delete, reload) are scheduled on the narration timing and awaited until the app's fetches settle, so every frame is deterministic.
10. Preview loops: `servers.sh reset && node tools/render.mjs preview <dir> <times...>`, then `tools/sheet.sh <dir> sheet.png 3` (contact sheets), and reviewed the stills. Four rounds, with fixes in between (see below).
11. `servers.sh reset && node tools/render.mjs video $SCR/out/silent.mp4`: renders 2359 frames at 30 fps as PNG and pipes them into `libx264 -preset slow -crf 14 -pix_fmt yuv420p`.
12. `node tools/mix.mjs out/silent.events.json out/audio.wav`: places the narration at its timeline positions and synthesizes soft click and tap sounds with `aevalsrc` (no downloaded assets) at the real click times. Then two-pass `loudnorm` to -16 LUFS and -1.5 dBTP, 48 kHz stereo. Result: -15.9 LUFS, peak -2.2 dBFS.
13. `tools/mux.sh out/silent.mp4 out/audio.wav out/captions.srt out/video.mp4`: copies the video stream, encodes the audio as AAC 192k, and adds the captions as a soft English `mov_text` subtitle track, with faststart.
14. Checked the result:
    - `ffprobe`: H.264 1920×1080 at 30 fps, AAC 48 kHz stereo, 21 subtitle cues, 78.6 s, 7.8 MB.
    - `ebur128` on the final AAC track: -15.9 LUFS, peak -2.2 dBFS.
    - `silencedetect`: speech starts at 0.903 s against 0.900 s planned, and the second phrase at 3.850 s against 3.838 s, so audio and picture are in sync.
    - Pulled 25 frames from the final MP4 into three contact sheets and reviewed every scene.
    - Pulled `poster.png` at 15.2 s.
15. Copied `video.mp4`, `captions.srt`, `poster.png` and `video-source/` (the scripts and the stage) to `outputs/`. Then ran `servers.sh stop`, confirmed that nothing listens on 8112 or 8212 and that no Chrome or ffmpeg processes are left, and ran `rm -rf $SCR`. The repo's `git status` is still clean. No Docker containers, images or volumes were created.

Render cost: the frame capture took 520 s for 2359 frames (about 4.5 fps, PNG screenshots). Preview rounds took about 20 to 40 s each.

## What went wrong, and the fixes

- **No Playwright npm package on the machine**, only its browser binaries. I didn't install anything. Instead I drove Playwright's `chrome-headless-shell` directly with a small CDP client over a pipe, which also needs no debug port.
- **zsh parse error** from `SCRATCH=... time node ...`. Reran it without `time`.
- **This ffmpeg build has no `drawtext`, `subtitles` or `ass` filters** (no freetype or libass). The contact sheets have no labels, and the captions ship as a soft subtitle track plus an `.srt` file instead of being burned into the picture.
- **The cursor snapped away after clicks.** After the tick the row moves, and after the delete it disappears, so the live-resolved target jumped or vanished, and the delete ripple was missing. Fix: click positions and the cursor's end points are frozen at the moment of the click, before the action runs.
- **Sparse previews resolved positions against a stale device layout.** Fix: `freeze()` lays out the devices for its own timestamp first.
- **Scene polish.** The "Laptop or phone" headline nearly touched the laptop (headline 78 px → 72 px, devices moved right). The "Simple on purpose" card came in late (it now enters with the first sentence). The outro had 0.35 s of empty screen and then a messy crossfade (it now starts as the previous scene finishes fading). After the delete, the cursor rested on the next row's Delete button (it now moves away). The laptop click point moved right so the typed text doesn't pass under the cursor. Removed a favicon from the browser mockup, because the real app has none.
- **`mix.mjs` input index bug** (each `-i` adds two argv entries). Fixed.
- **Click sounds were too loud** (only about 4.5 dB under the speech peaks). Lowered by 6 dB.
