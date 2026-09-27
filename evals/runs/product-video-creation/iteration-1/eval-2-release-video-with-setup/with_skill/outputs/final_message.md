The release video is ready: `videos/taskboard.mp4` (53 s, 1080p, poster `videos/taskboard.jpg`). It is also embedded at the top of `README.md`.

What it shows:
1. **Problem (13 s):** two team members say the problem in their own words (whiteboard wiped, chat scrolled away).
2. **Setup (14 s):** the two README commands, `cp .env.example .env` and `docker compose up -d`, typed at normal speed in Terminal, with the real Compose output.
3. **Usage (17 s):** the real Taskboard, recorded live. A task is added, one is ticked off and one is deleted.
4. **Summary (8 s):** the problem again, this time solved, plus the two commands.

The voices are Zoe (Premium) as narrator, with Ava and Lee for the team members.

Assumptions (you said just go ahead):
- There's no repo URL in the video, only the two commands. Send me the URL and I'll add it to scene 4.
- The terminal starts in the checked-out `taskboard` folder, so no `git clone`.
- The browser bar shows `localhost:8080` as in the README. This recording ran on a different port.
- The tasks in the demo are made up but realistic (toner, meeting room, a customer callback).

To change it, go to `videos/taskboard/`. Edit `lines.mjs`, then run `node tts.mjs`, then `TASKBOARD_URL=http://localhost:8080 node record.mjs product`, then `node render.mjs`, and copy `out/taskboard.mp4` and `out/taskboard.jpg` to `videos/`.
