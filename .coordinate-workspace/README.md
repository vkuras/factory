# Coordinate eval runs

What each run of the `coordinate` skill decided, kept so a later iteration can be
compared against it. The fixtures the runs read are not here: they are git
repositories, so they travel as bundles in `.factory-evals/bundles/coord-*.bundle`
and `.factory-evals/restore.sh` clones them into `.factory-evals/seeds/`.

```
iteration-1/         first draft, run on opus and (in iteration-1-sonnet) on sonnet
iteration-1-sonnet/  the same draft on the model the coordinator will actually run on
iteration-2-sonnet/  after the language and verbatim-relay fixes
prompts/             the eval prompts, with REPO and OUTDIR substituted at spawn time
```

The runs are stubbed on purpose. The four factory agents cost hundreds of thousands
of tokens per pipeline, and what can actually break in the coordinator is its
decisions, not the stages. So each run gets the repo plus an agent's final message
and records what it would do: `spawn-N.md` per agent it would start,
`to-stakeholder.md` for what it would say, `decision.md` for why.

This leaves the long run untested — context loss over twenty handovers, a stage
returning `failed`. That needs a real pipeline run on a small product.
