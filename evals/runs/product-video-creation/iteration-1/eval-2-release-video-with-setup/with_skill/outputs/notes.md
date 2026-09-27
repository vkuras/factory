# Notes: eval-2 release video with setup (with_skill)

## Commands, in order
1. `sh plugins/factory/skills/product-video-creation/scripts/check_voices.sh` → exit 0, 8 premium voices (Ava, Isha, Karen, Lee, Jamie, Matilda, Serena, Zoe); node 25.8.1, ffmpeg present.
2. Read README.md, CLAUDE.md, package.json, docker-compose.yml, Dockerfile, .env.example, docs/product.md, docs/requirements/001-task-list.md, src/*, public/*.
3. `cp .env.example .env`
4. `PORT=8103 COMPOSE_PROJECT_NAME=taskboard-e2ws docker compose up -d` (real output saved; ~1 s, image layers cached)
5. `curl localhost:8103/api/tasks` → `{"tasks":[]}`
6. `cp -R <skill>/engine videos/taskboard`, set package name to `taskboard`, `npm install`, `npx playwright install chromium`
7. Wrote `lines.mjs` → `node tts.mjs` (speech 41.4 s)
8. Wrote `flows/product.mjs` → `TASKBOARD_URL=http://localhost:8103 node record.mjs product` (16.11 s, 3 cues)
9. Changed lines a2/a3 → `node tts.mjs` (speech 42.6 s; s3 lines unchanged, so no re-record)
10. `ffmpeg -sseof -0.5 -i recordings/product.mp4 … product-end.png` (end state for scene 4)
11. Wrote scenes s1–s4 and product styles in styles.css
12. `node stills.mjs 2 6 11 13.5 17 20 24 27 35 45 50`, `sh sheet.sh …` → found overlapping quote crossfade in scene 1, fixed
13. `node render.mjs --preview`, checked narration timeline (no overlaps) and a preview contact sheet
14. `node render.mjs` → out/taskboard.mp4, 53.4 s, 1920×1080 h264 + aac
15. Full-size still at 36 s checked for readability; copied mp4/jpg to `videos/`, added the poster link under `# Taskboard` in README.md
16. `docker compose -p taskboard-e2ws down -v --rmi local`; removed the `.env` created in step 3

## Deviations and issues
- Port: the stack ran on 8103 (eval constraint). The browser URL bar in the video shows `localhost:8080`, which is what the README gives new teams.
- Compose project name: ran as `taskboard-e2ws` so I didn't collide with parallel runs. In the terminal on screen the name is normalised to `taskboard` (as in a `taskboard` checkout). Repeated plain-progress status lines are collapsed, and the BuildKit step lines are left out. Otherwise the lines are the real output.
- Image layers were cached, so the build took about 1 s. On a first run on a fresh machine it would also pull node:22-alpine.
- No user available: I wrote the draft and 2 open questions to questions.md and continued with the defaults.
- Nothing was committed. SendUserFile wasn't used, as instructed.
- The `down --rmi local` output included the line "Dangling images Removed". Only this project's resources were targeted, and the other run's container (taskboard-8101-app-1) is still running.

## Token use
Tokens used: about 125k, all in one agent with no subagents. The largest items were reading the engine sources (~15k) and 5 image reads for stills and contact sheets.
