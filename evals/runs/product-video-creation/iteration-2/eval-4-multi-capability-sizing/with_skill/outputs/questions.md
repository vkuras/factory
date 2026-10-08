# Message I would send before building (script draft + questions)

Nobody could answer during this run, so I went ahead with this draft and its defaults.

---

Product video: **factory** · size: **chapters** · target **220–300 s** (about 4 min) · narrator af_heart (US female)

**Why this size:** you asked for the whole thing, and a viewer has to see six separate jobs to get it:
coordinate, groom, architect, implementer, validator and the merge request (plus the install as scene 2).
At 25–40 s each that is about 4 minutes of material: more than one continuous story can carry, but under
the ~5 minutes where an overview plus deep dives would pay off. The pipeline is also one story that reads
best in order, so it stays one film with one chapter per stage. Left out: the dashboard's setup
(`docker compose up`, `~/.factory/dashboard.env`) as its own chapter; the dashboard appears as the screen
that shows coordinate's work and as the implementer's result.

I can't run the pipeline for the film, so everything shown is the factory's real record of its first job,
ticket 001 (its own dashboard): the run log, the requirements, design, gaps, reports, the tests, the merged
PR #2, and the dashboard itself, recorded live.

```
1 · Problem (~23 s)                      plain stage, each speaker's role in small type
   Product owner (am_michael, US m): "I asked the agent for a dashboard. It built one. Just not the one I meant."
   Tech lead (bf_emma, UK f):        "It says all the tests pass. Of course they do. It wrote them itself."
   Developer (af_bella, US f):       "I don't code anymore. I babysit a chat. Every ten minutes: shall I continue?"
   Maintainer (bm_george, UK m):     "And a month later, nobody knows why it was built that way."
   Narrator (af_heart):              "The software factory fixes exactly that."

2 · Access (~22 s)                       Terminal, real output
   $ sed -n 34,35p README.md                     → the two install commands from the README
   $ claude plugin details factory | head -8     → real inventory from this Mac (skills, 4 agents, 7 hooks)
   Narrator: "It's a plugin for Claude Code. The README has the two commands: add the marketplace, then install the plugin."
             "Restart Claude Code, and every project has it: four agents, their skills, coordinate, and seven hooks that report what happens."

3 · Product (~175 s), one chapter per capability, chapter name top left
   3a Coordinate (~40 s)  the dashboard, recorded live at localhost:8787/ticket/001: ticket 001's route through the
                          stages (swimlanes), one run expanded to its STATUS line, your answers in "Your involvement"
      "You don't run the stages yourself. You tell coordinate what you want, in your own words, and it runs the pipeline."
      "This is the factory's first real job: its own dashboard. Sixteen handovers, and some of them go backwards."
      "Every agent ends with a status line. That line decides where the work goes next."
      "Only grooming talks with you. When an agent needs a decision, coordinate brings you its questions in one batch,
       and passes your answer on, word for word."
      "And if two stages bounce the same work six times, it stops and asks you."
   3b Groom (~27 s)       $ sed -n 30,47p docs/requirements/001-…md  (story S1 with its acceptance criteria)
                          $ grep '^| L' docs/requirements/001-…md | head -8  (your German sentences → where they went)
      "Grooming is a conversation. It asks until you both mean the same thing."
      "Then it writes the requirements: stories, acceptance criteria and rules, in plain words."
      "Every sentence you said is traced to where it went. Thirty-six of them, for this dashboard."
   3c Architect (~22 s)   $ ls docs/architecture/adr   ·   $ grep -A7 '^## Traceability' docs/architecture/001-…md
      "The architect works alone. It decides how to build it, and writes down why."
      "Every requirement gets a place in the design, and a test that proves it. Nothing is left open for someone to guess."
   3d Implementer (~30 s) $ npm test (real run: 300 passed)  ·  $ grep '^## G' docs/architecture/.gaps/001-…md
                          $ docker compose up -d → the dashboard in the browser
      "The implementer builds exactly that design, tests included. Three hundred of them, here."
      "Where the design has a hole, it doesn't guess. It sends the gap back to the architect."
      "Then it starts the real thing in Docker, and uses it, before anyone else sees it."
   3e Validator (~28 s)   its own black-box suite, its round-1 evidence screenshot (F1), the round-2 screenshot,
                          $ head -8 docs/validation/001-…md (Verdict: Validated)
      "The validator checks the running product against what you agreed, not against the implementer's own tests."
      "In round one, it found three trend charts that never said whether things got better. That was a gap in the
       design, so it went back."
      "Round two: eighty-six of eighty-six checks pass. Validated."
   3f Merge request (~27 s) $ gh pr view 2 (real output of the merged PR)
      "Then coordinate asks you one question: push, and open the merge request? Nothing leaves your machine before you say yes."
      "The merge request is built from the run's own records. Its first line tells the reviewer the truth:
       no person reviewed this on the way."
      "Merging stays your call."

4 · Summary (~16 s)      the dashboard's end state behind, then the name and the two install commands
   "The dashboard you meant, because it asked first. Tests checked by someone who didn't write them. No babysitting.
    And anyone can read why it was built that way."
   "The software factory. A plugin for Claude Code."
```

**Open questions** (my default in brackets — "looks good" keeps all three):

1. **Install output.** I wasn't allowed to change your Claude Code setup, so scene 2 shows the README's two
   install commands and the real `claude plugin details factory` from this Mac, not the install commands'
   own output. Shall I run the two commands once in a throwaway `CLAUDE_CONFIG_DIR` so the film can show
   their real output? [No: keep it as described.]
2. **Private repo.** GitHub reports `vkuras/factory` as private, while `docs/product.md` says the repository
   is public, and the film ends on `claude plugin marketplace add vkuras/factory`. Will it be public before
   the video is shared? [Yes: I keep the command as the README has it.]
3. **Ticket 001 in the dashboard.** The dashboard didn't exist during its own run, so I re-entered that run
   through the dashboard's reporting API from `docs/.factory/run-001.md`, the commit times and your quoted
   answers (L31–L36). Start times are the previous stage's hand-over, and tokens weren't recorded, so they
   show "—". Fine, or would you rather see the run log as a file in the terminal? [Fine: keep the dashboard.]
