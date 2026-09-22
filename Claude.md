The project language is english even if i give you german commands always write files in english

All skill evals live under `evals/` and nowhere else: cases in `evals/cases/<skill>/evals.json`,
fixtures in `evals/fixtures/`, runs and benchmarks in `evals/runs/<skill>/`. When running an eval
(for example with skill-creator), use `evals/runs/<skill>/` as the workspace instead of the default
`<skill>-workspace/`. See `evals/README.md`.