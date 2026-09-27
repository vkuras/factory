The Taskboard product video is done: 72 seconds, 1080p, narrated by Zoe (Premium).

**Video:** `videos/taskboard.mp4` (poster `videos/taskboard.jpg`). It's now at the top of `README.md`.

**What it shows**
1. **Problem (~20 s):** three people describe the problem in their own words: "We lose stuff every week. The whiteboard gets wiped." (that's your stakeholder's quote from the requirements), then a chat message that scrolled away, then "nobody knows what's already done". The narrator adds: "Taskboard fixes exactly that."
2. **Product (~36 s):** the real app, recorded live. Someone adds "Order toner for the printer", ticks off a task, and deletes one that isn't needed anymore. Then the same list opens on a phone, where the toner gets ticked off.
3. **Summary (~14 s):** the whiteboard, chat and "what's done" problems from the start, now solved. It ends with where to open Taskboard.

**Assumptions** (nobody was around to confirm them, so I went with my own defaults):
- The film is meant for new team members, so there's no install scene. The last shot shows the README's address, **localhost:8080**. If people use a different office address, send it and I'll swap it in.
- The speakers in scene 1 have roles only (team lead, designer, office manager), no invented names.
- The tasks in the demo are made up but realistic. I put them in through the app's own API before recording.

**To change it** (in `videos/taskboard/`, with the app running):
1. Edit `lines.mjs`.
2. Run `node tts.mjs`.
3. Run `node record.mjs product && node record.mjs phone && node shot.mjs`.
4. Run `node render.mjs`.
5. Copy `out/taskboard.mp4` and `out/taskboard.jpg` to `videos/`.

The recordings expect the app on port 8101. For a different port, set `TASKBOARD_URL`, for example `TASKBOARD_URL=http://localhost:8080`.
