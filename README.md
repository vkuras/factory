# factory

A software factory: four autonomous stages that turn an idea into validated software.

```
groom → architect → implementer → validator
```

Each stage is a **skill** (the method) plus an **agent** (the autonomous runner of that method).
Grooming is the one stage meant to be run interactively with a human; the `groom` agent exists
for the return path, when the validator or the architect sends a change request back to
requirements.

The repository is both a Claude Code **plugin** and the **marketplace** that serves it, so the
factory installs on any machine without absolute paths.

## Layout

```
.claude-plugin/marketplace.json     the marketplace index
plugins/factory/
  .claude-plugin/plugin.json        the plugin manifest
  agents/                           groom, architect, implementer, validator
  skills/                           the same four, as skills with references/ and evals/
```

## Install on a machine

```bash
claude plugin marketplace add vkuras/factory
claude plugin install factory@factory
```

Then restart Claude Code. `claude plugin details factory` lists what got registered: four skills
and four agents, available in every project on that machine.

For work on the factory itself, point the marketplace at the working copy instead, so edits take
effect without pushing:

```bash
claude plugin marketplace add ./
claude plugin install factory@factory
```

## How the agents find their skill

An agent invokes its skill by name (`factory:validator`), never by file path. Plugin skills
resolve the same way on every machine, which is why the agents carry `Skill` in their tool list
and no path anywhere.

## Models

| Stage | Model | Why |
|---|---|---|
| groom | opus | Requirements are the most expensive place to be wrong |
| architect | opus | Design decisions bind everything downstream |
| implementer | sonnet | Bounded work against an explicit design |
| validator | opus | Last check before the stakeholder sees the product |

## Evaluating a skill

Each skill has `evals/evals.json`. Runs and their benchmarks live in `.<skill>-workspace/`
at the repository root, together with the fixtures in `.factory-evals/`. Both are untracked.
