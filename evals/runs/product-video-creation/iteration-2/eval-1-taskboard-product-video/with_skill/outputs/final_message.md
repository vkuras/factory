The Taskboard video is done: `videos/taskboard.mp4` (56 s, 1080p). The README now opens with it, using the poster `videos/taskboard.jpg`.

**What it shows:** The video opens on the office whiteboard. Three colleagues describe the problem in their own voices: the board gets wiped, the chat scrolls away, and nobody knows what's done. Then comes the real Taskboard, recorded live: someone adds "Order printer toner", ticks it off, and deletes a job that's no longer needed. It closes with "Nothing gets wiped. Nothing scrolls away. And everyone knows what's done."

**What I assumed** (nobody answered my draft questions, so I went with my defaults):
- The audience is new colleagues using the Taskboard already running in the office. So there's no setup scene, just "no account, no login". If other teams will set up their own copy, I can add a 10-second scene showing `cp .env.example .env` and `docker compose up -d` with their real output.
- I don't know the office address. The browser bar shows `localhost:8080` from the README, and the narration says "anywhere on the office network". Send me the real address and I'll put it in.
- The example tasks (toner, landlord, meeting room) sound real but are made up.

**To change it:** in `videos/taskboard/`, edit `lines.mjs`, then run `node tts.mjs` → `node record.mjs product` → `node render.mjs`.

**Before you re-record:** recording clears the task list and fills it with demo tasks, so don't run it against the office copy. Start a separate one instead:
- `PORT=8111 DATA_DIR=/tmp/taskboard-video npm start`
- `TASKBOARD_URL=http://localhost:8111 node record.mjs product`

The flow also refuses to clear a list that has real tasks in it.

Nothing is committed yet. `README.md` and the new `videos/` folder are in the working tree.
