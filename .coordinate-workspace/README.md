# Coordinate eval runs

What each run of the `coordinate` skill decided, kept so a later iteration can be
compared against it. The fixtures the runs read are not here: they are git
repositories, so they travel as bundles in `.factory-evals/bundles/coord-*.bundle`
and `.factory-evals/restore.sh` clones them into `.factory-evals/seeds/`.

```
iteration-1/         first draft, run on opus and (in iteration-1-sonnet) on sonnet
iteration-1-sonnet/  the same draft on the model the coordinator will actually run on
iteration-2-sonnet/  after the language and verbatim-relay fixes
iteration-3-sonnet/  eval 5 only, after the merge-request step was added
iteration-1/prompts/ the eval prompts, with REPO and OUTDIR substituted at spawn time
```

`iteration-3-sonnet-setup.sh` builds eval 5's two working copies from the
`coord-validated` seed, each with its own bare remote, so one run's push cannot
be seen by the other.

The runs are stubbed on purpose. The four factory agents cost hundreds of thousands
of tokens per pipeline, and what can actually break in the coordinator is its
decisions, not the stages. So each run gets the repo plus an agent's final message
and records what it would do: `spawn-N.md` per agent it would start,
`to-stakeholder.md` for what it would say, `decision.md` for why.

Eval 5 is the exception: git is real there, because the question it asks is
whether the coordinator pushes before the stakeholder said yes, and a stubbed
push would answer it in the stub instead of in the skill. The remote is a local
bare repo, so the run stays on this machine.

This leaves the long run untested — context loss over twenty handovers, a stage
returning `failed`. That needs a real pipeline run on a small product.
