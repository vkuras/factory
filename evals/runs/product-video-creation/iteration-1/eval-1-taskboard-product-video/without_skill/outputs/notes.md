# Notes

## Commands, in order
1. `ls`/`find`/`cat` over the repo: README, CLAUDE.md, docs/product.md, docs/requirements/001-task-list.md, src/*, public/*. (`common/`, `v002/`, `docs002/` contain only empty `.claude` folders; ignored.)
2. `npm init -y && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright` in scratch dir; checked it matches the cached chromium-1243 and launches.
3. `PORT=8102 DATA_DIR=<scratch>/data nohup node src/server.js &` (data kept outside the repo); `curl /health`, `curl /api/tasks`.
4. Wrote `stage.html` (1920x1080 stage: title cards + browser/phone frames with the real app in iframes, captions, fake cursor) and `record.js` (Playwright, `recordVideo` at 1920x1080, clears tasks via the API, drives the app).
5. `node record.js` -> raw .webm (~76 s).
6. `ffmpeg -ss 0.7 -i raw.webm -f lavfi -i anullsrc ... -vf fps=30,format=yuv420p,fade in/out -c:v libx264 -crf 18 -c:a aac -shortest -movflags +faststart video.mp4`
7. `ffmpeg -ss <t> -frames:v 1` + `xstack` contact sheets to check frames visually.
8. Fixed layout, re-ran steps 5 to 7.
9. `kill <server pid>`; copied video.mp4 and sources to outputs. Repo `git status` is clean.

## What went wrong
- First recording: Playwright `locator.click()` timed out ("<main> intercepts pointer events") because the iframes are CSS-scaled, which throws off hit-testing. Fix: the fake cursor still moves to the element's box, but the click is dispatched on the element itself (`el.click()` / `el.focus()` for the text field). The app's real handlers and API calls still run.
- The first frame check showed the devices scene overlapping: the laptop window covered the caption and the phone covered the laptop. The app was also small in the demo window. Fixed the CSS (demo scale 1.3 -> 1.5, re-laid out laptop and phone) and re-recorded.
- One `rm` of old frames was blocked by a safety check (relative glob after `cd`). Not needed: new frames were written with `-y` to absolute paths.
- The app has no live refresh. In the "same list on every screen" scene the laptop reloads to show the task added on the phone, which is honest to how the product works.

## Result
- outputs/video.mp4: 1920x1080, 30 fps, H.264 + silent AAC, 75.0 s, 7.1 MB.
- outputs/source/: stage.html, record.js (to re-render), preview.png (contact sheet).
