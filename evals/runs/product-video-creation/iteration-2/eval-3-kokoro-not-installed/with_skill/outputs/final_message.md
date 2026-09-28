No video yet: the voice engine isn't set up on this machine, and installing it needs your OK.

**May I install Kokoro?** It's the local neural voice model for the voiceover (Kokoro-82M, Apache-2.0, so fine for commercial use). About 1.3 GB in `~/.cache/product-video` and `~/.cache/huggingface`: Python packages from PyPI (kokoro, soundfile, torch, spaCy, misaki), spaCy's English model (~13 MB) and the Kokoro-82M model (~330 MB) plus voices from Hugging Face. Setup takes one or two minutes. Nothing is downloaded yet, and I won't use the macOS `say` voices instead: they sound read out and are licensed for personal, non-commercial use only.

Meanwhile I ran Taskboard, clicked through add, tick off and delete with realistic tasks, and drafted the script. One "yes" and I build the film.

## Draft script

```
Product video: Taskboard · size: one story · target 45–75 s (~60 s) · narrator af_heart (US female)
Why this size: one core flow (write a task down, tick it off, delete it), and you asked for short.

1 · Problem (~14 s)
   On screen: Taskboard's own off-white background, a small role caption per speaker.
   Team lead (am_michael, US m):       "We had it all on the whiteboard. Then somebody wiped it."
   Office manager (bf_emma, UK f):     "And in the chat? Gone by lunch. It just scrolls away."
   Account manager (bm_george, UK m):  "Nobody knows what's done. We find out when a customer asks."
   Narrator (af_heart):                "Taskboard fixes exactly that. One list, for the whole room."

2 · Access (~9 s)
   On screen: Terminal.app, the README's two commands typed at human speed, with the output of a
   real run: cp .env.example .env, then docker compose up -d
   Narrator: "It runs on your own machine in the office. Two commands, and it's up."

3 · Product (~28 s), recorded live at http://localhost:8080 in a browser window (~900 px wide)
   Seeded through the product's own API: "Book the meeting room for Friday's demo",
   "Call the printer technician", "Send the Hoffmann invoice", "Renew the domain before the 30th" (done).
   The shared list                 Narrator: "This is the list. Everyone in the room opens the same one.
                                              No sign-up, no login."
   Types "Order toner for the      Narrator: "Something comes up? Write it down while you think of it."
   printer", Enter, it's on top              "There. Now everyone can see it."
   Ticks "Call the printer         Narrator: "Finished? Tick it off. It drops to the bottom, crossed out,
   technician": struck through,              so nobody does it twice."
   moves below the open tasks
   Deletes the meeting-room task   Narrator: "Not needed anymore? Delete it. Gone for everyone."
   A second of silence on the updated list.

4 · Summary (~10 s)
   On screen: the list's end state, then "Taskboard" in its own green on its own background,
   with docker compose up -d below.
   Narrator: "Nothing gets wiped. Nothing scrolls away. And everyone knows what's done."
   Narrator: "Taskboard. Your team's list, on your own machine. Start it with docker compose up."
```

Questions (my default holds if you just say "go"):
1. Kokoro install, as above. Without it there's no voiceover.
2. Scene 1: do you have a real photo of the team's whiteboard, or a screenshot of the chat? Default: the voices over the plain background, no mock-ups.
3. Is there a public repo URL for the ending? Default: the repo has no remote, so it names `docker compose up -d`.

After your yes: `scripts/setup_kokoro.sh`, then the project in `videos/taskboard/` (`node tts.mjs` → a real `docker compose up -d` run for scene 2 → `node record.mjs product` → stills review → `node render.mjs`). The film goes to `videos/taskboard.mp4`, with a poster link under `# Taskboard` in `README.md`.
