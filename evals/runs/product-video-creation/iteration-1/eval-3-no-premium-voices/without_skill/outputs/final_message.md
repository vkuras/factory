Here's a 40-second product video of Taskboard: `outputs/video.mp4` (1920x1080, voiced).

What's in it:
1. Title card ("Write it down. Tick it off.") and the empty list
2. Adding tasks by typing and pressing Enter; they appear newest first
3. Submitting an empty title shows "A title is required."; adding a real task clears the message
4. Ticking a task off: it moves below the open ones, struck through
5. Deleting a task with one click
6. The same list on a phone (390 px wide), adding and ticking off a task there
7. End card with `docker compose up -d`: no accounts, runs on your own machine

**Voice:** there's no Premium voice on this Mac, so the narration uses "Ava (Enhanced)". It's clear but a bit robotic. If you install a Premium voice (System Settings > Accessibility > Spoken Content > Manage Voices), I can re-render the video with it in about a minute.

**How it was made:** I recorded the real app with Playwright on port 8106 using a throwaway data directory, generated the voice with `say`, and put it together with ffmpeg. The server is stopped and the repo is unchanged. To tweak the wording or timing, edit and re-run `record.mjs` and then `mux.mjs`, which are in `outputs/`.
