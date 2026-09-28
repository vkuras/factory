The Taskboard video is ready: `video.mp4`, 1:19, 1080p, with a voice-over.

It's aimed at new team members and runs in nine short scenes:

1. **The problem:** the whiteboard gets wiped and chat scrolls away.
2. **What it is:** one shared list for the team, and nothing gets wiped.
3. **Where to open it:** a browser on a laptop or phone, with no account and no login.
4. **Adding:** type a task and press Add task. New tasks go to the top.
5. **Ticking off:** the task is struck through and moves below the open ones.
6. **Sharing:** a teammate adds a task on their phone, and the laptop only shows it after a reload.
7. **Deleting:** for mistakes only. It's gone for everyone and can't be undone.
8. **What it doesn't do:** no due dates, assignees or notifications.
9. **Close:** "Write it down. Tick it off."

Every interaction is the real app, running from this repo and driven by scripted clicks and typing.

**Also in `outputs/`:**
- `captions.srt`: the narration as subtitles. They're also inside the MP4 as a subtitle track you can switch on; they aren't burned into the picture.
- `poster.png`: a thumbnail.
- `video-source/`: the scripts to re-render the video when the UI changes.

**Choices I made without you:**
- **No address shown.** The README only gives `localhost:8080`. Send me the real address and I'll add it.
- **Made-up example tasks,** such as printer paper, coffee beans and a customer call-back.
- **A green check-mark logo on the title cards.** It's a placeholder, since the app has no logo.
- **The macOS voice "Ava (Premium)" and no music,** because I had no licensed track to use.

One thing to keep in mind: the video says the page doesn't refresh by itself, which is how the app works today. If auto-refresh gets added, scene 6 needs a re-cut.
