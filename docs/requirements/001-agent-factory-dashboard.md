# 001 – Agent Factory Dashboard

- Type: MVP
- Status: Designed – ready for implementation
- Date: 2026-09-20
- Product context: docs/product.md

## Summary

The software factory runs four autonomous agents but leaves the operator blind: they cannot see
what is running, which tickets are waiting on a decision from them, or whether the factory is
getting better. This MVP is a dashboard that shows all of it on one page, plus the reporting that
the factory must start doing so there is something to show. The operator opens it and immediately
sees what needs them and why; over weeks they can see whether the factory needs them less and
loops less, which is how they decide when to go and change the factory itself. The dashboard only
shows — every action stays in Claude Code.

The visual design is fixed and supplied by the stakeholder as `Agent Factory Dashboard.dc.html`
plus `support.js`. It is the specification for layout, structure and wording of the three tabs and
the detail view. Three deviations from it are recorded in this document (D4, D5, D6) and win over
the design file where they conflict.

## Users and roles

One role: the **operator** (see `docs/product.md`). There is no second role, no login and no
permission model — the installation runs on the operator's own Raspberry Pi.

## Stories

### S1 – See what needs me

As the operator, I want a list of the tickets that need me, so that I know what to do without
searching for it.

Acceptance criteria:
- Given tickets exist, when I open the dashboard, then it opens on the Attention tab (R11).
- Given a ticket meets an attention rule (R1), when I look at the Attention tab, then it appears
  in the list with its id, its title, the reason it is there, a one-sentence explanation of that
  reason, and its severity.
- Given several tickets need me, when I look at the list, then they are ordered by the severity of
  their reason as R1 defines it, and within the same severity the one untouched longest comes
  first.
- Given a ticket appears in the list, when I look at it, then I also see its status, which agent
  owns it now, how long it has been untouched, how many loops it has had, and how many times I
  have intervened on it.
- Given tickets exist that meet no attention rule, when I look at the Attention tab, then they are
  listed separately and compactly below as tickets running on their own, with their count.
- Given no ticket meets an attention rule, when I look at the Attention tab, then it tells me
  nothing needs me rather than showing an empty list.
- Given no ticket exists at all, when I open the dashboard, then it tells me there is nothing yet
  instead of showing empty lists and charts.

### S2 – See whether anything is running

As the operator, I want to see whether agents are working right now, so that I can tell a quiet
factory from a stalled one.

Acceptance criteria:
- Given agent runs are in progress, when the page loads, then the header shows how many were in
  progress at that moment (R7).
- Given no agent run is in progress, when the page loads, then the header says so.

### S3 – See the whole pipeline

As the operator, I want to see all tickets across the four stages, so that I can see where the
work sits.

Acceptance criteria:
- Given tickets exist, when I open the Pipeline tab, then I see four columns — Grooming, Design,
  Implementation, Verification — each with its ticket count.
- Given a ticket is in a stage, when I look at that column, then its card shows the id, the title,
  the current status, the number of loops, how long the ticket has been alive, the tokens it has
  consumed and how many times I have intervened.
- Given a ticket has a status, when it is placed in a column, then the placement follows R2.

### S4 – Follow one ticket's whole life

As the operator, I want to open a ticket and see everything that happened to it, so that I can
understand why it is where it is.

Acceptance criteria:
- Given I click a ticket anywhere in the dashboard, when the detail view opens, then it shows the
  id, the title, the current status, the agent status, and six figures: how long the ticket has
  been alive, total agent working time, loops, my interventions, tokens and number of agent runs.
- Given a ticket has agent runs, when I look at the detail view, then I see a time axis with one
  lane per agent and one lane for me, each run drawn at its position and length, and a run that
  failed or was blocked by the environment marked as such.
- Given a ticket has agent runs, when I look at the detail view, then I see every run listed
  newest first, each with the agent, the result, when it started, how long it took, how many
  tokens it used, and a one-line summary.
- Given a run is listed, when I expand it, then I see what that agent actually output, in order,
  as a numbered list, and which status the ticket moved to as a result — or that it did not move
  (R6).
- Given I intervened on a ticket, when I look at the detail view, then my interventions are listed
  separately with what I did and when.
- Given a ticket changed status over its life, when I look at the detail view, then I see the
  sequence of statuses it passed through.

### S5 – See whether the factory is getting better

As the operator, I want trends over months, so that I can tell whether the factory needs me less
and loops less, and decide when to change it.

Acceptance criteria:
- Given history exists, when I open the Analytics tab, then I see four trends in weekly steps over
  the last six months: interventions per ticket, loops per ticket, lead time and agent working
  time.
- Given a trend is shown, when I look at it, then it also states the change between the first and
  the last week shown, and whether that change is an improvement or not.
- Given less than six months of history exists, when I look at a trend, then it covers only the
  period that has data and names that period (R8).
- Given tickets exist, when I open the Analytics tab, then I also see one row per ticket over its
  lifetime with my interventions, loops, lead time, agent working time and tokens, ordered so the
  tickets that cost me most come first.
- Given agent runs exist, when I open the Analytics tab, then I see how many tokens and how much
  time each of the four agents has consumed in total.
- Given agent runs exist, when I open the Analytics tab, then I see how often tickets were handed
  back at each junction, and how often an agent run failed.

### S6 – The factory reports what it does

As the operator, I want every agent and the coordinator to report what they do, so that the
dashboard has something to show.

Acceptance criteria:
- Given an agent begins a run on a ticket, when it starts, then the dashboard knows that run is in
  progress, on which ticket, and by which agent.
- Given an agent finishes a run, when it ends, then the dashboard receives the output that run
  produced, its result, its duration and the tokens it used.
- Given an agent reports its output, when I read it in the dashboard, then it is what the agent
  produced in Claude Code, not a summary rewritten for the dashboard (R6).
- Given an agent reports, when the run ends, then the same output still appears in Claude Code as
  it does today (R5).
- Given I intervene on a ticket, when the coordinator continues, then my intervention is reported
  with what I did and when (R4).
- Given the dashboard cannot be reached, when an agent reports, then the agent run continues and
  finishes normally, and that part of the history is simply missing (R9).
- Given agents run in a repository other than the one the dashboard is installed from, when they
  report, then their tickets appear in the same dashboard (R3).

### S7 – Set when a ticket should bother me

As the operator, I want to set the two thresholds that decide when a ticket needs me, so that the
Attention list matches how closely I want to watch.

Acceptance criteria:
- Given I have set a loop threshold, when a ticket reaches that many loops, then it appears in the
  Attention list for that reason (R1).
- Given I have set an idle threshold, when a ticket has been untouched for that long and is not
  finished, then it appears in the Attention list for that reason (R1).
- Given I have not set either, when the dashboard runs, then it uses the design's defaults: three
  loops and 24 hours.

## Business rules

**R1 – Attention rules.** A ticket needs the operator if one of the following holds. The first one
that matches decides the reason and the severity; the order is the design's:

| # | Condition | Reason shown | Severity |
|---|---|---|---|
| 1 | Status is `Blocked – waiting for requirements` | needs requirements | blocking |
| 2 | Status is `Blocked – waiting for architecture` | design gap | blocking |
| 3 | An agent run failed and the ticket is not `Validated` | agent run failed | check |
| 4 | Status is `Changes requested – back to implementation` | changes requested | review |
| 5 | Loops reach the operator's loop threshold | loop threshold | review |
| 6 | The agent status is `in-grooming` | open questions | answer |
| 7 | Untouched for at least the idle threshold and not `Validated` | idle | review |

Severity orders the list: blocking, then check, then review, then answer.

**R2 – Stage of a ticket.** The requirements status determines the stage and the owning agent:

| Status | Stage | Owner |
|---|---|---|
| `In grooming` | Grooming | groom |
| `Groomed – ready for architecture` | Grooming | groom |
| `Designed – ready for implementation` | Design | architect |
| `Implemented – ready for validation` | Implementation | implementer |
| `Validated` | Verification | validator |
| `Changes requested – back to implementation` | Implementation | implementer |
| `Blocked – waiting for architecture` | Design | architect |
| `Blocked – waiting for requirements` | Grooming | groom |

**R3 – A ticket's identity.** A ticket is identified by the `NNN` number of its requirements
document. The dashboard does not show which repository a ticket comes from; the operator
recognises that from the title.

**R4 – The operator is part of the history.** An intervention by the operator is recorded on the
ticket like an agent run: it appears in its own lane on the time axis, in the run list, in the
separate list of interventions, and it counts towards the ticket's intervention count. It consumes
no tokens.

**R5 – Reporting is a copy, never a move.** Everything an agent reports to the dashboard still
appears in Claude Code exactly as it does today.

**R6 – Agent output is shown as the agent produced it.** The expanded run lists what the agent
output, in order and numbered. The steps are not classified, categorised or labelled by kind.

**R7 – "Agents online".** The number in the header is how many agent runs were in progress at the
moment the page was loaded.

**R8 – History.** Nothing is ever removed. Trends cover the last six months in weekly steps; with
less history they cover only the period that has data and name it.

**R9 – The dashboard never breaks the factory.** If reporting fails for any reason, the agent run
continues and completes. The missing report costs history, never work.

**R10 – Where to report is configurable.** Which dashboard an agent reports to is set per
installation, so agents in any repository can report to the operator's dashboard, and so someone
else can run the factory against their own dashboard elsewhere.

**R11 – Landing tab.** The dashboard opens on Attention.

**R12 – The page is a snapshot.** The page shows the state it had when it was loaded. It does not
refresh itself and shows no indication of how old the data is. The operator reloads to see more.

## Quality expectations

- The dashboard and the factory run on the operator's Raspberry Pi and must live within its
  resources. Everything else competes with the agents for the same machine.
- Opening the dashboard and switching between the three tabs feels immediate. Waiting for a page
  that is only meant to tell you whether anything needs you defeats its purpose.
- It is used on a normal computer screen in a browser. There is no phone use case.
- Dark appearance only, as the supplied design gives it. No light mode.
- The operator recognises within seconds of the page loading whether anything needs them. This is
  the product's main promise.
- The factory must not become noticeably slower or less reliable because it now reports.

## Scope

### In scope

- S1 See what needs me
- S2 See whether anything is running
- S3 See the whole pipeline
- S4 Follow one ticket's whole life
- S5 See whether the factory is getting better
- S6 The factory reports what it does — including the changes to the four agents and the
  coordinator that this requires
- S7 Set when a ticket should bother me

### Later

- Notifications, so the operator does not have to look themselves.
- A repository indicator on a ticket, for when there are too many projects to recognise by title.

### Out of scope

- Any action taken from the dashboard: starting, stopping, answering, approving, editing. All of
  that stays in Claude Code.
- The dashboard changing anything about the factory by itself.
- Login, accounts, roles, permissions.
- Cost in a currency. Tokens only.
- A light mode or a phone layout.

## Decisions

- **D1 – The dashboard only shows, it never acts.** Stakeholder: "das dient nur der ubersicht. ich
  mache actions in claude code".
- **D2 – No repository indicator on a ticket.** Stakeholder: there are few enough projects that
  the title is enough. Parked under Later.
- **D3 – Reporting is built into the agents.** Stakeholder decided that the agents must report;
  they explicitly left the mechanism to the architect.
- **D4 – Trends cover six months in weekly steps**, not the eight weeks the design file shows.
  Stakeholder, correcting the design during the walkthrough. Overrides the design.
- **D5 – No "synced X ago" and no self-refresh.** The page shows what was true when it loaded.
  Stakeholder, correcting the design during the walkthrough. Overrides the design.
- **D6 – No step kinds in an expanded run.** The design's `read / think / tool / write / check`
  labels were placeholders; the column falls away and only the agent's own output is listed.
  Stakeholder, correcting the design during the walkthrough. Overrides the design.
- **D7 – Cost in euros was considered and dropped.** Stakeholder first preferred euros, then
  dropped it when the price would have to be either maintained by hand or baked in and go stale:
  "dann lass die preise doch weg".
- **D8 – No login.** Stakeholder: it runs on their own Pi.
- **D9 – History is kept forever.** Stakeholder: "erstmal fur immer. ich glaube nicht das wir
  soviele daten haben werden".
- **D10 – "Agents online" means runs in progress right now.** Groomer proposal, accepted by the
  stakeholder, from their wish to see "ob momentan wirklich was lauft".
- **D11 – An unreachable dashboard never fails an agent run.** Groomer proposal, accepted.
- **D12 – A fresh installation says there is nothing yet** instead of showing empty charts.
  Groomer proposal, accepted.
- **D13 – Loops are counted as the design counts them**: every run of an agent on a ticket beyond
  its first. Groomer proposal, accepted.

## Stakeholder technical constraints

Verbatim, as givens for the architect:

- "die application und die factory werden auf einem raspberry pi laufen wir haben also nicht so
  viele resourcen" — the deployment target is a Raspberry Pi shared with the factory itself.
- "Muss aber trotzdem dockerized sein" — dockerized despite the constrained hardware.
- "die agenten könnten auch in einem anderen repo laufen sollen aber trotzdem zum dashboard
  reporten" — agents are not confined to the repository the dashboard lives in.
- "Das dashboard könnten leute die dass repo nutzen auch anders hosten. Das muss also irgendwie
  configurierbar sein" — the repository is public and others host the dashboard elsewhere.
- On how agents should report: "Zum Beispiel könnten die am Ende einen Call machen. Das kann aber
  auch ein Skill sein, den die dann am Ende nochmal aufrufen. Skills bestimmt besser, weil das
  belasse ich auch den Architekten ein bisschen." — a leaning, explicitly handed to the architect
  to decide.

The supplied design files `Agent Factory Dashboard.dc.html` and `support.js` are in
`Agent Factory Dashboard Design.zip` at the repository root. The stakeholder stated the design is
fixed. It is a Claude Design component, not production code: it is the specification for layout,
structure and wording, and its mock data, its `TRANSCRIPT` generator and its `RAW` array are
illustrative only.

## Left to architecture

- **How an agent reports.** The product need is that a run's start, its output, its result, its
  duration and its token use reach the dashboard (S6), from any repository (R10), without ever
  breaking the run (R9). The stakeholder leans towards a skill the agents call, and explicitly
  handed the decision over.
- **How an agent's output is captured.** The product need is R6: the operator reads what the agent
  actually produced. Today a subagent's output only surfaces when it finishes.
- **How the dashboard knows a run is in progress.** The product need is S2 and R7.
- **How the coordinator's reporting fits in.** The product need is R4.
- **Where the history lives and how it is configured.** The product needs are R8 (kept forever, on
  a Pi), R10 (configurable target) and the Raspberry Pi constraint.
- **How the design file becomes the running UI.** The product need is that the result matches the
  supplied design, with D4, D5 and D6 applied.
- **Whether the factory's existing artifacts are a source.** `docs/.factory/run-NNN.md` and the
  requirements documents already carry status and stage information the dashboard needs (R2).

## Glossary

Terms are defined in `docs/product.md`. Additionally:

- **Agent status** — the `STATUS:` value an agent ends its run with, such as `groomed`,
  `changes-requested`, `needs-architect`. Distinct from the ticket's requirements status.
- **Result of a run** — what a run ended as, including `failed` and `blocked-environment`.
- **Lead time** — how long a ticket has been alive.
- **Agent working time** — the summed duration of a ticket's agent runs, the operator's own time
  excluded.

## Open questions

None.

## Appendix: Stakeholder input trace

| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Ich brauche eine applikation um die faktory zu überwachen und zu verbessern" | Summary, S1, S5 |
| L2 | "Außerdem mochte ich wissen wann ich selbst eingreifen muss" | S1, R1 |
| L3 | "Das design steht ja schon ... Das design ist fest." | Summary, Stakeholder technical constraints |
| L4 | "die application und die factory werden auf einem raspberry pi laufen wir haben also nicht so viele resourcen" | Quality expectations, Stakeholder technical constraints |
| L5 | "Muss aber trotzdem dockerized sein" | Stakeholder technical constraints |
| L6 | "die agenten könnten auch in einem anderen repo laufen sollen aber trotzdem zum dashboard reporten" | S6, R10 |
| L7 | "Das dashboard könnten leute die dass repo nutzen auch anders hosten. Das muss also irgendwie configurierbar sein" | R10, Stakeholder technical constraints |
| L8 | "Erstmal nur ich aber das repo ist offentlich könnte also jeder selbst aufsetzen" | Users and roles, docs/product.md |
| L9 | "in factory" (the dashboard is built in the factory repo) | This document's location |
| L10 | "Das feature muss selbst nichts verbessern. Wenn ich das dashboard offne und sehe das ich zum beispiel viel eingreifen muss oder agenten fehlen, dann werde ich selbst die factory anpassen mussen." | S5, Out of scope, docs/product.md non-goals |
| L11 | "Jedesmal wenn der coordinator mich frage. Zum beispiel wenn ich requirements besser geben muss" | R1 rules 1 and 6, S1 |
| L12 | "ich mochte die architectur selbst abnehmen befor der implementer started" | Process instruction for this pipeline run; not a product requirement |
| L13 | "ja genau ich das dient nur der ubersicht. ich mache actions in claude code" | D1, Out of scope |
| L14 | "Aktuell gar nicht ... da die anzahl an projekten uber schaubar ist und ich auch von der ticket description das weis" | R3, D2, Later |
| L15 | "AF-241 ist quasi ein platzhalter fur das ticket was NNN nummer hat" | R3 |
| L16 | "Ich werde spater die factory auf dem pi laufen lassen. Das wurde mir die info geben ob momentan wirklich was lauft." | S2, R7, D10 |
| L17 | "Wir müssen das in die Agenten einbauen ... Skills bestimmt besser, weil das belasse ich auch den Architekten" | S6, D3, Left to architecture |
| L18 | "Das läuft auf dem Pi. Wir brauchen also jetzt erstmal keine Berechtigung" | D8, Out of scope |
| L19 | "Ich würde sehen, dass es was taugt, wenn ich immer eine Übersicht habe, dass ich was machen muss ... oder wenn ich sehe, die machen zu viele Loops" | docs/product.md core value, S1, S5 |
| L20 | "Was heißt agenten failen: Konnte die aufgabe nicht vollenden, ich musste interagieren, loop limit ereicht" | R1 rules 3, 1, 2 and 5 |
| L21 | "Ja soll er und auch die ausgabe welche normal in claude code steht senden. Aber ich will trotzdem die ausgabe in claude code noch haben" | S6, R5 |
| L22 | "erstmal fur immer. ich glaube nicht das wir soviele daten haben werden" | R8, D9 |
| L23 | "Benachrichtigungen machen wir spater" | Later |
| L24 | "Ja euro wäre eigentlich besser" → "dann lass die preise doch weg" | Dropped (agreed), D7, Out of scope |
| L25 | "wenn ich ausklappe mochte ich den output in der nummerierten schrittliste sehen" | S4, R6 |
| L26 | "ich will nicht nur 8 wochen 6 monate" + "wochen uber 6 monate" | S5, R8, D4 |
| L27 | "Wenn ich nicht so viele daten habe soll mir der zeitraum fur den ich daten habe angezeigt werden" | S5, R8 |
| L28 | "remove das synced es soll sich beim laden der seite aktualisieren" | R12, D5 |
| L29 | "da soll kein mapping sein nur stehen was der agent normalerweise mir in claude desktop ausgegeben hatte. Die werte waren place holder" + "ja fallt weg" | R6, D6 |
| L30 | Architecture approval before the implementer applies to this run only (confirmed) | Process instruction; not a product requirement |
