# Notes

## Commands, in order
1. Read the repo: README.md, CLAUDE.md, .env.example, Dockerfile, docker-compose.yml, package.json, docs/product.md, src/*, public/*, docs/requirements/001-task-list.md.
2. Checked tools: `docker info`, `node -v`, `ffmpeg -version`, Playwright Chromium cache.
3. Ran the documented setup for real (port changed to 8104 for this run):
   - `cp .env.example .env && sed -i '' 's/^PORT=8080/PORT=8104/' .env`
   - `docker compose -p taskboard-video-8104 up -d` (built image, ~11 s)
   - `docker compose -p taskboard-video-8104 ps` -> `Up (healthy)`, `curl localhost:8104/health` -> `{"status":"ok"}`
4. Scratch dir: `npm init -y && npm i playwright@1`.
5. Wrote scene pages (title, terminal, phone frame, end card) and `record.js` (Playwright, recordVideo 1280x720; captions and click rings injected into the live app page, app zoomed 1.3x for legibility; tasks reset via the API before recording).
6. `node record.js` -> one .webm per scene plus start offsets.
7. `bash compose.sh` -> trims each scene, 0.3 s fades, H.264 re-encode, concat -> video.mp4 (47.2 s, 1280x720, 30 fps, no audio).
8. Reviewed a contact sheet of frames (ffmpeg tile), fixed issues, re-recorded (steps 6-7).
9. Cleanup: `docker compose -p taskboard-video-8104 down -v --rmi local`, `rm .env`; repo `git status` clean.

Sources for the video: `source/record.js`, `source/compose.sh`, `source/scenes/`.

## What went wrong / caveats
- First run of record.js failed: `page.addStyleTag` called with empty content. Removed the line.
- First cut: the "A title is required." error stayed visible during the tick/delete scenes (the app only clears it on the next submit). Reordered so a valid add follows the error. Terminal line wrapped and the terminal scene held too long; shortened both.
- The terminal scene is a replay, not a screen capture: the commands are the README commands, the output lines are shortened from the real `docker compose up -d` / `ps` output of this run and show the default project name `taskboard` and port 8080 (the real run used project `taskboard-video-8104` and port 8104).
- The app was recorded on port 8104; captions say http://localhost:8080 (the default new teams will get).
- Not shown: getting the code (no repo URL known), installing Docker, first-build time (~10 s).
