The project language is english even if i give you german commands always write files in english

All skill evals live under `evals/` and nowhere else: cases in `evals/cases/<skill>/evals.json`,
fixtures in `evals/fixtures/`, runs and benchmarks in `evals/runs/<skill>/`. When running an eval
(for example with skill-creator), use `evals/runs/<skill>/` as the workspace instead of the default
`<skill>-workspace/`. See `evals/README.md`.

Every merge request that changes anything under `plugins/factory/` bumps `"version"` in
`plugins/factory/.claude-plugin/plugin.json`, following semver: patch for fixes and wording, minor
for new or changed behaviour (a skill, an agent, a hook), major for a change that breaks the
contracts between the stages (status lines, document paths, file formats). `claude plugin update`
compares versions only, so without a bump an installed copy never receives the change. Bump from
the version on `main`; if `main` moves on before the merge, rebase and bump again. Changes outside
`plugins/factory/` (the dashboard, `evals/`, `docs/`) need no bump.