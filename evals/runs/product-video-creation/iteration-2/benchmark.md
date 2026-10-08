# Benchmark · product-video-creation · iteration-2

| Eval | Config | Passed | Pass rate | Tokens | Time |
|---|---|---|---|---|---|
| eval-1-taskboard-product-video | with_skill | 11/11 | 100% | 219,823 | 1350 s |
| eval-1-taskboard-product-video | without_skill | 6/11 | 55% | 279,026 | 2164 s |
| eval-2-release-video-with-setup | with_skill | 8/8 | 100% | 280,166 | 1604 s |
| eval-3-kokoro-not-installed | with_skill | 5/5 | 100% | 114,690 | 384 s |

| Config | Mean pass rate | Mean tokens | Mean time |
|---|---|---|---|
| with_skill | 100% | 204,893 | 1113 s |
| without_skill | 55% | 279,026 | 2164 s |

With the skill, on the 1 eval(s) run both ways: +45% pass rate, -21% tokens, -38% time.

## Compared with iteration-1

| Eval | Config | Pass rate | Tokens | Time |
|---|---|---|---|---|
| eval-1-taskboard-product-video | with_skill | 100% → 100% | 142,580 → 219,823 (+54%) | 665 → 1350 s |
| eval-1-taskboard-product-video | without_skill | 50% → 55% | 85,769 → 279,026 (+225%) | 612 → 2164 s |
| eval-2-release-video-with-setup | with_skill | 100% → 100% | 132,455 → 280,166 (+112%) | 479 → 1604 s |
| eval-3-kokoro-not-installed (was no-premium-voices) | with_skill | 100% → 100% | 50,410 → 114,690 (+128%) | 30 → 384 s |

## Notes

- 4 of 8 runs completed. After reviewing them the user stopped the round: the eval-2, eval-3 and eval-4 baselines were not run, and eval 4 with the skill was paused after its draft to stay under the Pro plan's 5-hour limit (two earlier attempts of this round were killed by it).
- Eval 4 with skill, not graded: its draft (outputs/questions.md) sized the factory film as chapters, 220-300 s, one chapter per stage, and said why; so the sizing table works for a large product.
- With skill 100% (24/24) vs 55% (6/11) for the one baseline. Eval 1 tokens: 219,823 with the skill vs 279,026 without (-21%); in iteration 1 the skill cost +66% on this eval.
- Against iteration 1 the with-skill runs cost more: eval 1 +54% tokens, eval 2 +112%, eval 3 +128% (it now studies the product and drafts the script while it waits for install consent; iteration 1 stopped after 30 s).
- Times are inflated: the runs shared the CPU (Kokoro, Chromium, ffmpeg) with 2-6 parallel runs, and eval 1 with skill was resumed once after a rate-limit stop (its time is active time without the pause).
- Baseline eval 1 used macOS 'Ava (Premium)' and the AI look the skill forbids: mint gradient, headline cards with eyebrow bars, pills, a fake team-chat UI in scene 1, a slogan end card; it asked 7 questions and did not touch the README.
- Found by the with-skill runs, for the next iteration: the recorded flow resets the product's data at its default URL (localhost:8080), which on a user's machine can be the team's real instance; stills.mjs cannot show typing in the middle of a recording; render.mjs --preview wrote 1920x1080 instead of 960x540.
