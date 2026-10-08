# Notes: release video for Taskboard (with skill)

Skill: `plugins/factory/skills/product-video-creation` (SKILL.md, references/script.md, references/engine.md).
Repo: `.../eval-2-release-video-with-setup/with_skill/repo`. Scratch: `.../scratchpad/it2/eval2-with`.
Result: `repo/videos/taskboard.mp4`: 50.17 s, 1920×1080, 30 fps, AAC 48 kHz stereo, -16.9 LUFS, 5.9 MB. It is also copied to `outputs/video.mp4`.
Wall clock is about 27 min. Token use is about 270k by the session counter (15.00M → 14.73M left).

## Script draft used

The user said "Mach einfach", so the draft went unapproved and the open points became assumptions in the final message.

- Size: one continuous story. Taskboard has one core flow (add, tick off, delete). The user's "max 60 Sekunden" set the target to 45–60 s (`"video": { "target": [45, 60] }`).
- Scene 2 is included because the brief asks how teams get it running.
- Voices: narrator `af_heart` (US f), team lead `am_michael` (US m), office manager `bf_emma` (UK f).

| Scene | Time | On screen | Lines |
|---|---|---|---|
| 1 Problem | 0–11 s | Office whiteboard with the team's to-dos (Marker Felt), wiped on "wiped"; faint ghost stays; role labels | Team lead: "Somebody wiped the whiteboard. Again." · Office manager: "Did anyone order the toner yet? Nobody knows." · Narrator: "Taskboard gives your team one shared list instead. Here's how to set it up." |
| 2 Access | 10.5–23.6 s | Terminal.app (Basic), 28 px: `cp .env.example .env`, `docker compose up -d`, real TTY output, gentle push-in on `[+] up 4/4` | "You need a machine with Docker. Copy the example settings, then start it with Docker Compose." · "Two commands, and it's running on port eighty eighty." |
| 3 Product | 23.4–41.9 s | Real Taskboard recorded live in a browser window (URL bar `localhost:8080`): seeded list, type "Buy milk for the kitchen" + Enter, tick "Order toner for the printer", delete "Call the landlord about the heating" | "Open it in any browser, on a laptop or a phone. Nobody needs an account." · "Something comes up? Type it in." · "Toner ordered? Tick it off, and everyone can see it's done." · "And anything you don't need anymore, you delete." |
| 4 Summary | 41.4–50.2 s | Last frame of the product steps aside; plain text: Taskboard, the two commands, "Then open localhost:8080" | "No more wiped whiteboard, and no more guessing what's done. Taskboard. Two commands, and your team has one list." |

## Commands, in order

1. `plugins/factory/skills/product-video-creation/scripts/check_tts.sh`: exit 0, Kokoro ready.
2. Read the repo: README, CLAUDE.md, package.json, docker-compose.yml, Dockerfile, .env.example, docs/product.md, docs/requirements/001, docs/architecture/*, docs/implementation/001, docs/validation/001, src/*, public/*.
3. `node -v` (25.8.1), `ffmpeg -version`, `docker info`, `docker images`, `docker ps`, `lsof -iTCP:8113/8213`: Docker running, ports free. `node:22-alpine` was not listed as an image.
4. `cp -R <skill>/engine repo/videos/taskboard`. In package.json I set `"name": "taskboard"` and `"video": { "target": [45, 60] }`.
5. `npm install` (3 packages) and `npx playwright install chromium` (already installed, Playwright 1.63.0).
6. In the repo I ran `cp .env.example .env`, then `script -q <scratch>/compose-up.typescript env PORT=8113 docker compose -p pvc-it2-e2-with up -d < /dev/null`. It exited 0 after 1.3 s because every build layer was cached.
7. `python3 <scratch>/vt.py compose-up.typescript` is a small VT replay that gives the final TTY screen (colours included). Scene 2 was built from it, changing only the project name `pvc-it2-e2-with` → `taskboard`, re-padding the columns the way compose does.
8. `docker compose -p pvc-it2-e2-with ps` (healthy), `curl localhost:8113/health`, `curl localhost:8113/api/tasks`.
9. `node .peek.mjs 960|900 1600 918`: a temporary Playwright script (deleted afterwards) that seeded tasks through the API and took screenshots to choose the viewport. I picked 960 CSS px in a 1600×918 box, so product text is about 30 px.
10. Wrote `lines.mjs` and ran `node tts.mjs`: 10 lines, 36.1 s of speech, no casting warnings.
11. `<kokoro venv>/python <scratch>/g2p.py` printed Kokoro's phonemes for Taskboard, Docker Compose, eighty eighty, toner and whiteboard. All were fine and no PRONOUNCE entries were needed.
12. Shortened `s3_add`, then ran `node tts.mjs` again (1 line re-rendered).
13. Wrote `flows/product.mjs`. `prepare` resets and seeds the list through the product's own API, and clicks are timed to land on their words. Then ran `TASKBOARD_URL=http://localhost:8113 node record.mjs product`: 17.672 s, 4 narration cues, 30 UI sounds.
14. A font check in headless Chromium (temporary script, deleted) picked Marker Felt for the whiteboard.
15. Wrote `scenes/s1–s4` and appended Taskboard styles to `styles.css` (the product's own colours). Set `index.html` `<title>`.
16. `node stills.mjs …` and `sh sheet.sh …` over four rounds, plus a temporary timing dump script (deleted).
17. `node render.mjs --preview` (50.2 s), then frame extraction and `silencedetect` to check that lines don't overlap.
18. `node render.mjs`: `out/taskboard.mp4` and `out/taskboard.jpg`. Then `ffprobe`, `ebur128` (I = -16.9 LUFS) and a 16-frame contact sheet of the final file.
19. Copied the files to `videos/taskboard.mp4` and `videos/taskboard.jpg`, and added the poster link under `# Taskboard` in README.md.
20. Cleanup:
    - `docker compose -p pvc-it2-e2-with down -v --rmi local` removed my container, network, volume and image tag.
    - `rm .env` in the repo.
    - Removed the render intermediates in `videos/taskboard/out/` (segments, preview, stills, mix.wav) and kept `out/taskboard.mp4` and `out/taskboard.jpg`.
    - Checked that ports 8113 and 8213 are free.

Nothing is committed in the product repo: README.md is modified and `videos/` is untracked.

## What went wrong or needed a second pass

- **Wiped whiteboard, first version.** The ghost text was too readable and the "smear" streaks looked like grey UI skeleton pills (AI look). I removed the streaks, cut the ghost from .085 to .045 opacity and replaced the crossfade with a soft left-to-right sweep, so it reads as erased rather than faded.
- **Terminal scroll.** Once the output passed 22 rows, a half-cut row showed in the body's top padding. I added a clipping viewport of exactly 22 × 39 px.
- **Scene 2 → 3 transition.** Crossfading the zoomed terminal into the browser gave a double exposure of two screens of text. Scene 3 now fades in only once the terminal has mostly faded (a dip through the desk colour), and the clip starts after the window is fully in, over its own first frame.
- **"press Enter" in s3_add.** The first version of the line said "press Enter" about 2 s before the key was pressed. I shortened it to "Something comes up? Type it in."; the Enter and the new row speak for themselves.
- **Cached build.** The real `docker compose up -d` was fully cached (1.3 s, `CACHED` steps). The terminal shows that real output unchanged. A new team's first start also pulls `node:22-alpine` and takes longer, and the narration makes no time claim. This is flagged in the final message.
- **`script` capture.** It echoed a `^D` (stdin was /dev/null). The echo is not shown in the film.
- **Pre-existing image content.** The built image `pvc-it2-e2-with-app` had ID b83c47c5 with a creation date of 2026-09-27, so the content came from the BuildKit cache of an earlier run. No other tag referenced it, and it was removed together with my project.
- **"Dangling images Removed".** Compose 5.5.1 printed this during `down`. I checked the 10 dangling image IDs I had listed at the start and all are still present, so nothing outside my project was pruned. I never ran `prune`, and the BuildKit cache is untouched.
- **zsh word-splitting.** One ffmpeg loop over a `$TS` string failed because zsh doesn't word-split. I re-ran it with literal values. There was no effect on the outputs.
