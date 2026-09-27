# Notes: eval-1 taskboard product video (with_skill)

## Commands, in order
1. `cat SKILL.md references/script.md references/engine.md scripts/check_voices.sh` and the engine sources (skill dir)
2. `sh scripts/check_voices.sh`: exit 0, 8 English premium voices (Ava, Isha, Karen, Lee, Jamie, Matilda, Serena, Zoe); node v25.8.1; ffmpeg 9.0.2
3. Read the repo: README.md, CLAUDE.md, docs/product.md, docs/requirements/001-task-list.md, package.json, docker-compose.yml, .env.example, Dockerfile, src/*, public/*
4. `PORT=8101 docker compose -p taskboard-8101 up -d --build` (the product's own run command; a unique project name and port so it can't collide with parallel runs), then `curl localhost:8101/health`
5. `mkdir videos && cp -R <skill>/engine videos/taskboard`, set package name to `taskboard`, `npm install`, `npx playwright install chromium`
6. Exploration screenshots with a scratch Playwright script (seeded two tasks via the API) at 900 px and 390 px
7. Wrote `lines.mjs`, then `node tts.mjs` (speech 59.9 s). Wrote `outputs/questions.md` (script draft plus 2 questions), continued with the defaults
8. Split s3_add/s3_top so "Press Enter" lands on the key press, `node tts.mjs` again (58.8 s)
9. Wrote `flows/seed.mjs` (reset and seed through the app's own REST API), `flows/product.mjs` (laptop, viewport 1000, box 1600×918), `flows/phone.mjs` (viewport 390, isMobile, touch mark instead of an arrow), `shot.mjs` (real end-state screenshot for scene 4)
10. `node record.mjs product` (25.8 s), `node record.mjs phone` (9.5 s), `node shot.mjs`; checked frames with ffmpeg
11. Wrote `scenes/s1-problem.js`, `s3-product.js`, `s4-summary.js`, extended `styles.css` with the product's colours (#f7f7f5, #1c1c1a, #2f6f4f), removed scene 2 from `main.js` and `index.html`
12. `node stills.mjs 3 11 17 20 22 && sh sheet.sh 3 11 17 20`, then `node stills.mjs 30 52 62 70 && sh sheet.sh …`
13. Fixed straight vs. curly apostrophe in p2 and `node tts.mjs`. Fixed a scene 4 overlap (my "Taskboard" caption sat on top of the app's own heading) with a new layout (window left, text right)
14. `node render.mjs --preview` (26 s), reviewed the contact sheet from the preview
15. Made the phone bigger (box 480×960, recording inset 16 px inside the rounded screen so square corners don't cut the bezel): `node record.mjs phone && node shot.mjs && node render.mjs` (75 s)
16. Review: extracted full-res frames at typing, tick, phone tap and summary; `ffmpeg -af volumedetect` (mean −19.8 dB, max −4.5 dB); total 72.3 s
17. `cp out/taskboard.{mp4,jpg} ../`, added the poster link under `# Taskboard` in README.md
18. `PORT=8101 docker compose -p taskboard-8101 down -v` (stopped the stack and removed the volume this run created)
19. Copied `videos/taskboard.mp4` to `outputs/video.mp4`

## What went wrong / notes
- `sh sheet.sh 70` fails with a single timestamp: ffmpeg's xstack needs at least 2 inputs. This is an engine bug; I looked at `out/still-70.png` directly instead.
- In the first scene 4 draft, my address caption sat on the screenshot and repeated the app's own "Taskboard" heading. Fixed with the side-by-side layout.
- In the first scene 3 phone, the square corners of the recording stuck out past the rounded bezel. Fixed by insetting the clip box.
- The recording ran on localhost:8101 (eval constraint), but the browser chrome shows the documented address, localhost:8080 (README). The app is identical. The office address is unknown, which is question 1 in questions.md.
- Scene 2 (access) was skipped on purpose: the audience is new team members, and they have no install or account step.
- No SendUserFile was used, per the eval instructions. The video is in outputs/video.mp4.
- Nothing was committed. The repo has a modified README.md and an untracked videos/ folder (tracked: videos/taskboard.mp4, .jpg and the video project; ignored: node_modules, audio, out, recordings/*.mp4).

## Timing / tokens
- Wall time of the render steps: preview 26 s, final 75 s, plus two recordings (~26 s and ~10 s real time).
- Token use of this run: about 95k tokens in this agent's context (reading the skill and engine ~25k, the rest was the build/review loop, including 8 image reads).
