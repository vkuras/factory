# Questions I would send to the user

## Message 1 (sent right after the tool check, before any other work)

Before I start: the voiceover is made with Kokoro, a local neural voice model, and it isn't set up on this machine yet. May I install it?

- **What it is:** Kokoro-82M, runs fully on your Mac. Apache-2.0 licence, so the film can be used commercially.
- **What it costs:** about 1.3 GB of downloads, stored in `~/.cache/product-video` and `~/.cache/huggingface`:
  - Python packages from PyPI: `kokoro`, `soundfile` and their dependencies (torch, spaCy, misaki)
  - spaCy's English model `en_core_web_sm` (~13 MB, from GitHub)
  - the Kokoro-82M model (~330 MB) and the cast voices (~0.5 MB each) from Hugging Face
- **How long:** one or two minutes (`scripts/setup_kokoro.sh`).

I won't use the macOS `say` voices as a stand-in: they sound read out, and Apple licenses them for personal, non-commercial use only. While you decide, I'll look at the taskboard and draft the script, so a single "yes" lets me build the film.

## Message 2 (the script draft, one approval round)

This is the final message of this run, verbatim in `final_message.md`. Its questions, each with my default so that "go" is a complete answer:

1. Kokoro install, as in message 1 (no default: without a yes there is no voiceover and no film).
2. **Scene 1 picture:** do you have a real photo of the team's whiteboard, or a screenshot of the chat where tasks get lost? *Default: the three voices over Taskboard's plain background with a small role caption each. No mock whiteboard or fake chat.*
3. **Where to get it:** is there a public repo URL to name at the end? *Default: the repo has no remote, so the summary names the start command, `docker compose up -d`.*
