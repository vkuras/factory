The release video is ready: `videos/taskboard.mp4`. It runs 50 s in 1080p with English voiceover, and the poster (`videos/taskboard.jpg`) at the top of the README links to it.

It opens on the office whiteboard getting wiped, with nobody knowing what's done. Then it runs the setup in Terminal (`cp .env.example .env`, `docker compose up -d`, with the output of a real run). Next comes the real Taskboard, recorded live: a task is added, one is ticked off and one is deleted. It ends on the two commands and `localhost:8080`.

You said to just go ahead, so I decided these myself:
- **Language:** the narration is English, like the app itself.
- **No download link:** the README doesn't say where teams get Taskboard. If you send me the repo or release URL, I'll add it at the end.
- **What the terminal shows:** the project name `taskboard` and port 8080, as in the README. My own run used port 8113 and its own project name.
- **Start time:** the start in the film takes 1.3 s because the build was already cached on this machine. A new team's first start also downloads `node:22-alpine`, so it takes longer. The voiceover doesn't promise a time.
- **Phones:** the film says to open it "on a laptop or a phone". The README only mentions `localhost:8080`, which works on the machine running Taskboard. Other devices need that machine's address, which would be worth a line in the README.

To change the film, work in `videos/taskboard/`:
1. Edit `lines.mjs`, then run `node tts.mjs`.
2. With the stack running, run `node record.mjs product`. Set `TASKBOARD_URL` if it isn't on `localhost:8080`.
3. Run `node render.mjs`.
4. Copy `out/taskboard.mp4` and `out/taskboard.jpg` to `videos/`.

Nothing is committed yet.
