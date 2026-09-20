# Agent Factory Dashboard

## Vision

A control room for the software factory. It answers two questions at a glance: does anything
need the stakeholder right now, and is the factory getting better or worse over time.

## Problem

The factory runs four autonomous agents — groom, architect, implementer, validator — driven by a
coordinator. Today all of that happens inside a Claude Code conversation and leaves almost no
trace: `docs/.factory/run-NNN.md` records one row per stage and nothing else. The stakeholder
cannot see what is running, cannot tell which tickets are stuck waiting for a decision from them,
and has no way of telling whether the factory is improving. They cope by remembering what they
started and by reading back through conversations.

## Target users

- **The factory operator.** Currently one person, the stakeholder, who runs the factory and
  changes it when it works badly. They look at the dashboard on a normal computer screen. They do
  not act in the dashboard — every action stays in Claude Code.
- **Anyone who self-hosts the repository.** The repository is public, so other people can set the
  factory and the dashboard up for themselves. They are not a separate role with different rights;
  they are the same operator role on their own installation.

## Core value

Two things, in this order:

1. When the operator opens the dashboard, they immediately see everything that needs them, and
   why.
2. Over weeks, they can see whether the factory needs them less, loops less and finishes faster —
   so they know when to go and change the factory itself.

## Non-goals

- The dashboard never acts. It starts nothing, stops nothing, answers nothing, edits nothing.
  Every action happens in Claude Code.
- The dashboard does not improve the factory by itself. It shows the operator that something is
  wrong; changing the factory is their job.
- No accounts, no login, no roles.
- No money. Agent cost is shown in tokens, never in a currency.

## Glossary

- **Factory** — the pipeline of four agent stages plus the coordinator that routes between them.
- **Agent** — one of groom, architect, implementer, validator.
- **Coordinator** — the component that runs the pipeline and is the only channel between the
  agents and the operator.
- **Ticket** — one requirements document and everything that happened to it. Its id is the
  document's `NNN` number.
- **Agent run** — one execution of one agent on one ticket. A ticket usually has several.
- **Loop** — every run of an agent on a ticket beyond its first one.
- **Intervention** — a point where the operator themselves acted on a ticket.
- **Attention** — the state of a ticket that needs the operator, with the reason why.

## Requirements index

| # | Title | Type | Status |
|---|---|---|---|
| 001 | Agent Factory Dashboard | MVP | Designed |
