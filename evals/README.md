# Evals

Every eval of every factory skill lives in this folder. Nothing eval-related belongs anywhere
else in the repository — not beside the skills, not in dot-folders at the root.

```
evals/
  cases/<skill>/evals.json   the test cases of one skill: prompts, expected output, assertions
  fixtures/                  hand-built input shared by all skills (see fixtures/README.md)
    base/                    the Taskboard product the seeds start from
    bundles/                 the seed repositories as git bundles (tracked)
    seeds/                   their working copies, rebuilt by restore.sh (untracked)
    restore.sh
  runs/<skill>/              every run of one skill's cases
    iteration-<N>/           one pass over the cases, with benchmark.json and benchmark.md
      eval-<id>-<name>/      one case: eval_metadata.json, with_skill/, without_skill/ or old_skill/
```

`<skill>` is the skill's directory name under `plugins/factory/skills/`: `groom`, `architect`,
`implementer`, `validator`, `coordinate`.

## Running an eval

The skill-creator workflow puts its workspace in `<skill>-workspace/` beside the skill by default.
In this repository that default does not apply: point it at `evals/runs/<skill>/` as the
workspace and at `evals/cases/<skill>/evals.json` as the case file.

Case files refer to fixtures by their path from the repository root, for example
`evals/fixtures/seeds/val-defects`. After a clone, or after a run has written into a seed, rebuild
the seeds:

```bash
evals/fixtures/restore.sh
```

## Adding evals

- **New case for an existing skill**: add it to `evals/cases/<skill>/evals.json`.
- **New skill**: create `evals/cases/<skill>/evals.json` and let its runs land in
  `evals/runs/<skill>/`.
- **New fixture**: add it under `evals/fixtures/` and describe it in `fixtures/README.md`. A fixture
  that has to be a git repository goes into `bundles/` as a bundle, because git cannot track a
  repository inside a repository.

## What is tracked

Cases, fixtures and bundles, and the record of every run (metadata, outputs, grading, timing,
benchmarks) are tracked. The working copies a run writes into (`runs/**/repo/`,
`runs/**/remote.git/`) and `fixtures/seeds/` are not; they are regenerated.

Runs recorded before this layout existed quote the old paths (`.factory-evals/`,
`.<skill>-workspace/`) in their outputs. They are left as they were: they are the record of what
happened.
