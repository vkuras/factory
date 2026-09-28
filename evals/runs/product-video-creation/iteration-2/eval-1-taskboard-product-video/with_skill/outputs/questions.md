Here's my draft for the Taskboard video. I got everything from the repo (docs/product.md, the 001 requirements with the stakeholder quotes, the README) and from clicking through the running app. If it looks good, just say so; the draft is the default for everything below.

```
Product video: Taskboard · size: one story · target 50–80 s (estimate ~60 s) · narrator af_heart (US female)
Why this size: Taskboard has one core flow (write a task down, tick it off, delete it), so one
continuous story is enough. No chapters.

1 · Problem (~15 s)
   On screen: the office whiteboard with the team's jobs in marker. It gets wiped on the first line.
   Team lead (am_michael, US m):  "We lose stuff every week. Someone wipes the whiteboard, and it's gone."
   Colleague (bf_emma, UK f):     "Or it's somewhere in the chat, and the chat has scrolled away."
   Colleague (bm_george, UK m):   "Did anyone order the toner? Nobody knows what's already done."
   Narrator (af_heart):           "Taskboard fixes exactly that."

2 · Access                     ← skipped: new colleagues open the Taskboard that already runs in
                                 the office. There is nothing to install and no account to create,
                                 and scene 3 says so.

3 · Product (~35 s), recorded live in the real app, shown in a browser window
   List: 4 open jobs (meeting room, landlord, contract, wobbly desk), 2 done ones.
   Open list             Narrator: "This is Taskboard. One list for the whole room. No account, no login."
   Type "Order printer   Narrator: "Something comes up? Write it down. One field, one button."
   toner", Add task      Narrator: "It lands at the top, and it stays there until it's done."
   Tick it off           Narrator: "An hour later, the toner's ordered. Tick it off."
                         Narrator: "It moves down and gets crossed out, so everyone knows it's done."
   Delete the meeting    Narrator: "Plans changed? Just delete it."
   room task
   Hold on the list      Narrator: "It's all saved on the office machine. Close it, come back tomorrow, it's still there."

4 · Summary (~10 s)
   On screen: the list as it ends in scene 3.
   Narrator: "Nothing gets wiped. Nothing scrolls away. And everyone knows what's done."
   Narrator: "That's Taskboard. Open it on your phone or your laptop, anywhere on the office network."
```

Open questions (each has a default, so you can skip them):
1. Who are the "new people"? I assumed new colleagues who use the Taskboard already running in your office, so there's no setup scene. If it's also for teams who'd run their own copy, I'll add a ~10 s scene 2 with the two real setup commands from the README (`cp .env.example .env`, `docker compose up -d`) and their real output.
2. What address do colleagues open it at (for example http://office-pc:8080)? Default: the browser bar shows localhost:8080 from the README, and the narration says "on the office network" without naming an address.
3. The example tasks are realistic but made up (toner, landlord, meeting room). Want your team's real ones instead? Default: keep these.
