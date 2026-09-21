# 001 – Agent Factory Dashboard

- Type: MVP
- Status: Implemented – ready for validation
- Date: 2026-09-20 (change-request passes: CR1 and the coordinator's future, then the
  stakeholder's answers to the open points of that pass, then D19 taken together with the design
  approval, all the same day)
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
the detail view. Four deviations from it are recorded in this document (D4, D5, D6, and D14 as
refined by D16 and D17) and win over the design file where they conflict.

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
  in the list with its id, the repository it comes from whenever R3 shows the repository, its
  title, the reason it is there, a one-sentence explanation of that reason, and its severity.
- Given several tickets need me, when I look at the list, then they are ordered by the severity of
  their reason as R1 defines it, and within the same severity the one untouched longest comes
  first.
- Given a ticket appears in the list, when I look at it, then I also see its status, which agent
  owns it now, how long it has been untouched, how many loops it has had, and how many times I
  have intervened on it.
- Given tickets exist that meet no attention rule, when I look at the Attention tab, then they are
  listed separately and compactly below as tickets running on their own, with their count, each
  with the repository it comes from whenever R3 shows the repository.
- Given two tickets from different repositories have the same number, when I look at the Attention
  tab, then I can tell from the repository shown on each which is which, without opening them.
- Given every ticket the dashboard has ever received comes from one and the same repository, when
  I look at any tab or at a ticket's detail view, then no repository is shown anywhere (R3).
- Given only one repository had ever reported and a ticket from a second repository is now
  reported, when I load the dashboard again, then every ticket shows the repository it comes from,
  on every tab and in the detail view, including the tickets that were stored before the second
  repository reported, and no ticket and no part of its history is lost or changed (R3).
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
- Given a ticket is in a stage, when I look at that column, then its card shows the id, the
  repository it comes from whenever R3 shows the repository, the title,
  the current status, the number of loops, how long the ticket has been alive, the tokens it has
  consumed and how many times I have intervened.
- Given a ticket has a status, when it is placed in a column, then the placement follows R2.
- Given two tickets from different repositories have the same number, when I look at the Pipeline
  tab, then each card shows its own repository and the two cards are two separate tickets.

### S4 – Follow one ticket's whole life

As the operator, I want to open a ticket and see everything that happened to it, so that I can
understand why it is where it is.

Acceptance criteria:
- Given I click a ticket anywhere in the dashboard, when the detail view opens, then it shows the
  id, the repository it comes from whenever R3 shows the repository, the title, the current
  status, the agent status, and six
  figures: how long the ticket has been alive, total agent working time, loops, my interventions, tokens and number of agent runs.
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
  lifetime with the repository it comes from whenever R3 shows the repository, my interventions,
  loops, lead time, agent working time and tokens, ordered so the tickets that cost me most come
  first.
- Given agent runs exist, when I open the Analytics tab, then I see how many tokens and how much
  time each of the four agents has consumed in total.
- Given agent runs exist, when I open the Analytics tab, then I see how often tickets were handed
  back at each junction, and how often an agent run failed.

### S6 – The factory reports what it does

As the operator, I want every agent run and every intervention of mine to be reported, no matter
what drives the pipeline, so that the dashboard has something to show.

Acceptance criteria:
- Given an agent begins a run on a ticket, when it starts, then the dashboard knows that run is in
  progress, on which ticket, and by which agent.
- Given an agent finishes a run, when it ends, then the dashboard receives the output that run
  produced, its result, its duration and the tokens it used.
- Given an agent reports its output, when I read it in the dashboard, then it is what the agent
  produced in Claude Code, not a summary rewritten for the dashboard (R6).
- Given an agent reports, when the run ends, then the same output still appears in Claude Code as
  it does today (R5).
- Given I intervene on a ticket, when the factory continues, then my intervention is reported with
  what I did and when (R4).
- Given the coordinator is one day switched off and a shell script drives the factory instead,
  when agents run and I intervene, then all of it still reaches the dashboard (R13).
- Given the dashboard cannot be reached, when an agent reports, then the agent run continues and
  finishes normally, and that part of the history is simply missing (R9).
- Given agents run in a repository other than the one the dashboard is installed from, when they
  report, then their tickets appear in the same dashboard, kept apart from tickets of the same
  number in another repository, and from then on every ticket shows the repository it comes from
  (R3, R10).
- Given I start an agent by hand in a Claude Code chat, when it finishes, then nothing about that
  run reaches the dashboard, and the result it left in the requirements document is picked up by
  the next reported run (D18, Out of scope).

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

**R3 – A ticket's identity.** A ticket is identified by the repository it comes from together with
the `NNN` number of its requirements document. The same number in two repositories is two
different tickets with two separate histories, always, independently of what is shown on screen.

Whether the repository is shown depends on how many repositories the dashboard has heard from
(D17):

- While every ticket the dashboard has ever received comes from one and the same repository, the
  repository is shown nowhere. There is nothing to tell apart, and the number and title are enough.
- From the moment a ticket from a second repository is reported, the repository is shown wherever
  a ticket appears (D16): on attention cards, on the compact "running on their own" chips, on
  pipeline cards, in the per-ticket analytics row and in the detail view's head. It is shown on
  every ticket, including the tickets of the first repository and including the tickets that were
  stored before the second repository reported.
- Once a second repository has reported, the repository keeps being shown, also if only one
  repository is active again. The older tickets stay in the history (R8) and still have to be told
  apart.
- The dashboard is a snapshot (R12), so the change becomes visible the next time the page is
  loaded.
- Nothing is lost or rewritten when the repository starts being shown: every ticket already
  reported, and its whole history, stays exactly as it is. Only the display changes.

The repository is shown as its name; how that name is determined is a technical question and
already settled (see "Left to architecture"). The operator never types a repository anywhere.

**R4 – The operator is part of the history.** An intervention by the operator is recorded on the
ticket whoever or whatever drives the pipeline at the time (R13), like an agent run: it appears in
its own lane on the time axis, in the run list, in the separate list of interventions, and it counts towards the ticket's intervention count. It consumes
no tokens.

What counts as an intervention (D19): **every message the operator types into a session in which
the pipeline is already running** is one intervention on that session's ticket, and the text of
that message is what the dashboard shows as what the operator did. It does not matter what the
message is about: answering a question the factory asked, correcting an agent, or just telling it
to carry on — all of it counts, and all of it counts the same. Nothing judges whether a message was
"really" an answer.

Two boundaries follow from this and from rules already set:

- A message typed in a session where the pipeline is not running is not an intervention; in
  particular the message that first starts the pipeline in a session is not one, because no run of
  that session has been reported yet.
- Runs the operator starts by hand in a Claude Code chat reach the dashboard not at all (D18), so
  messages in such a chat are no interventions either.

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

**R13 – Reporting does not depend on the coordinator.** The stakeholder intends to switch the
coordinator off and drive the factory with a shell script instead, and does not want to depend on
the coordinator. Whatever drives the pipeline — today's coordinator or the shell script that
replaces it — every agent run and every intervention of the operator must still reach the
dashboard. A requirement is never met by "the coordinator does it" alone. Runs that nothing drives,
because the operator typed them into a Claude Code chat themselves, are deliberately not covered
(D18, Out of scope).

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
- S6 The factory reports what it does — including the changes to the factory that this requires,
  without the reporting depending on the coordinator (R13)
- S7 Set when a ticket should bother me
- A repository indicator on every ticket, shown everywhere a ticket appears, from the moment a
  second repository reports (R3, D14, D16, D17)

### Later

- Notifications, so the operator does not have to look themselves.

### Out of scope

- Any action taken from the dashboard: starting, stopping, answering, approving, editing. All of
  that stays in Claude Code.
- The dashboard changing anything about the factory by itself.
- Login, accounts, roles, permissions.
- Cost in a currency. Tokens only.
- A light mode or a phone layout.
- Agent runs the operator starts by hand in a Claude Code chat, for example by typing
  `/architect`, with neither the coordinator nor a shell script driving them. Such a run does not
  reach the dashboard, so it is missing from the ticket's history; the result it leaves in the
  requirements document is picked up by the next reported run (D18).
- A repository indicator while only one repository has ever reported (D17).

## Decisions

- **D1 – The dashboard only shows, it never acts.** Stakeholder: "das dient nur der ubersicht. ich
  mache actions in claude code".
- **D2 – No repository indicator on a ticket.** Stakeholder: there are few enough projects that
  the title is enough. Parked under Later. **Superseded by D14.**
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

### Change-request decisions (2026-09-20)

- **D14 – The repository indicator comes out of Later and is built now.** Raised by the architect
  as CR1 (`docs/requirements/.change-requests/001-agent-factory-dashboard.md`): two repositories
  reporting to one dashboard both produce a ticket `001`, and the design resolved it by keeping the
  repository internal and showing only the number and the title. The stakeholder overturned that
  resolution: "Kippen: Repo-Anzeige aus Later holen". What changed: R3 now says a ticket is
  identified by repository *and* number and that the repository is shown on the ticket; D2 is
  superseded; the Later entry is gone; S1, S3, S4 and S5 show the repository wherever they show a
  ticket. The supplied design file has no such element, so this is a fourth deviation from it and
  wins over the file, like D4, D5 and D6.
  - Two points the stakeholder had not stated at the time and the groomer decided were put back to
    the stakeholder and are now answered: where the indicator appears (D16, confirmed) and when it
    is shown (D17, overturned).
- **D15 – Nothing in the requirements depends on the coordinator existing.** Stakeholder: "Der
  coordinator wird in der zukunft abgeschaltet und durch shell script ersetzt ich will mich nicht
  auf den verlassen." This is both a wording change and a constraint. Wording: R4 and S6 no longer
  say the coordinator reports the operator's interventions; they say the intervention is reported
  whatever drives the factory, and R13 states the independence as a rule. Constraint: the verbatim
  sentence is recorded under "Stakeholder technical constraints", because how reporting survives
  the coordinator's replacement is the architect's decision. Nothing about *what* the dashboard
  shows changed.

### Decisions on the open points of that pass (2026-09-20)

The pass above carried three points the stakeholder had not stated. They were put to the
stakeholder and answered:

- **D16 – The repository is shown everywhere a ticket appears.** Asked: where should the
  repository label be, since the groomer chose everywhere while CR1 named only the card and the
  table. Stakeholder: "Überall, wo ein Ticket vorkommt". This confirms the groomer's decision, so
  nothing changed: attention cards, the compact "running on their own" chips, pipeline cards, the
  per-ticket analytics row and the detail view's head all show it (R3).
- **D17 – The repository is shown only once a second repository has reported.** Asked: always, or
  only from the second repository on, since the groomer chose always. Stakeholder: "Erst ab dem
  zweiten Repo". This overturns the groomer's decision. R3 now describes three situations: while
  only one repository has ever reported nothing is shown; from the first ticket of a second
  repository the label appears on every ticket everywhere, also on tickets stored earlier; and it
  stays once it has appeared. S1 carries the two acceptance criteria for the switch, and S1, S3,
  S4, S5 and S6 now say "whenever R3 shows the repository" instead of showing it unconditionally.
  Three consequences follow from rules the stakeholder already set and were decided by the groomer
  rather than asked again: the label appears on the next page load, because the page is a snapshot
  (R12); it does not disappear again when only one repository is active, because the older tickets
  stay in the history forever (R8) and would otherwise become ambiguous; and no ticket or history
  is lost or changed by the switch, because only the display changes.
- **D18 – Agents started by hand are out of scope.** Asked: must an agent the operator starts
  themselves in a chat, for example `/architect`, also reach the dashboard, since the groomer had
  put that into R13 while the stakeholder's sentence named only the shell script. The stakeholder
  first replied "das raff ich nicht fuer das mehr aus"; after a plainer explanation — that such a
  run would be missing from the dashboard's history, and that its result in the requirements
  document is picked up by the next reported run — the answer was "nein". So R13 covers whatever
  drives the pipeline (today's coordinator, or its future shell-script replacement) and no longer
  says "or an agent started by hand"; hand-started runs are listed under Out of scope with that
  consequence spelled out.

### Decision taken with the design approval (2026-09-20)

- **D19 – Every message in a running session is an intervention.** Asked, because R4 could be read
  in two ways and the approved design had settled on one of them: "Was soll im Dashboard als
  Eingriff ('your calls') zählen?" — A, only answers to questions the factory asks, which is how
  the stakeholder's earlier sentence "Jedesmal wenn der coordinator mich frage" (L11) could be
  read; or B, every message typed in the running session, as the design's ADR-0008 and its
  assumption 10b have it. Stakeholder: **"B das design ist abgenommen"**. So every message the
  operator types into a session in which the pipeline is already running counts as one intervention
  on that ticket, and its text is what the dashboard shows as what they did — regardless of whether
  it answers a question, corrects an agent or only says carry on. This overrides the "only answers"
  reading of L11. R4 now says it explicitly, and the glossary entry in `docs/product.md` follows.
  No acceptance criterion changed: S4 and S6 already say interventions are reported and listed
  "with what I did and when" and take from R4 what an intervention is. The approved design
  (`docs/architecture/001-agent-factory-dashboard.md`, ADR-0008, assumption 10b) stays correct —
  this decision is what it assumed, now a requirement instead of an assumption.

## Stakeholder technical constraints

Verbatim, as givens for the architect:

- "die application und die factory werden auf einem raspberry pi laufen wir haben also nicht so
  viele resourcen" — the deployment target is a Raspberry Pi shared with the factory itself.
- "Muss aber trotzdem dockerized sein" — dockerized despite the constrained hardware.
- "die agenten könnten auch in einem anderen repo laufen sollen aber trotzdem zum dashboard
  reporten" — agents are not confined to the repository the dashboard lives in.
- "Das dashboard könnten leute die dass repo nutzen auch anders hosten. Das muss also irgendwie
  configurierbar sein" — the repository is public and others host the dashboard elsewhere.
- "Der coordinator wird in der zukunft abgeschaltet und durch shell script ersetzt ich will mich
  nicht auf den verlassen." — the coordinator is temporary; reporting must not be built on it
  (R13).
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
- **How interventions get reported.** The product need is R4 and R13: an intervention must be
  recorded whatever drives the pipeline, including after the coordinator is replaced by a shell
  script. Runs and interventions in a chat the operator drives themselves are out of scope (D18).
- **How reporting survives the coordinator being switched off.** The product need is R13. The
  existing design hangs reporting on Claude Code hooks and the coordinator's rounds; whether that
  still holds for a shell-script-driven factory is the architect's call.
- **How the dashboard knows whether more than one repository has ever reported (R3, D17).** The
  product need is that the label is absent while there is only one repository and present on every
  ticket from the moment a second one reports, without anything being lost in the switch.
- **What name a repository is shown under (R3).** The product need is that the operator recognises
  the project at a glance and never has to type it. The design already derives a project key per
  repository (ADR-0006: the `owner/repo` of the `origin` remote, else the directory name,
  overridable per installation); using that same name for the indicator is the architect's to
  confirm.
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
| L11 | "Jedesmal wenn der coordinator mich frage. Zum beispiel wenn ich requirements besser geben muss" | R1 rules 1 and 6, S1 — as a definition of an intervention it is superseded by L36/D19 |
| L12 | "ich mochte die architectur selbst abnehmen befor der implementer started" | Process instruction for this pipeline run; not a product requirement |
| L13 | "ja genau ich das dient nur der ubersicht. ich mache actions in claude code" | D1, Out of scope |
| L14 | "Aktuell gar nicht ... da die anzahl an projekten uber schaubar ist und ich auch von der ticket description das weis" | R3, D2, Later — superseded by L31 |
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
| L31 | "Kippen: Repo-Anzeige aus Later holen" (answer to CR1) | R3, D14, S1, S3, S4, S5, In scope; removes the Later entry and supersedes D2 |
| L32 | "Der coordinator wird in der zukunft abgeschaltet und durch shell script ersetzt ich will mich nicht auf den verlassen." | R13, D15, R4, S6, Stakeholder technical constraints, Left to architecture, docs/product.md glossary |
| L33 | "Überall, wo ein Ticket vorkommt" (where the repository label belongs) | R3, D16 — confirms the groomer's decision, nothing changed |
| L34 | "Erst ab dem zweiten Repo" (when the label is shown) | R3, D17, S1, S3, S4, S5, S6, In scope, Out of scope, Left to architecture — overturns the groomer's "always" |
| L35 | "nein" (must a hand-started agent, e.g. `/architect` in a chat, reach the dashboard?), after "das raff ich nicht fuer das mehr aus" and a plainer explanation | R13, D18, S6, Out of scope, Left to architecture |
| L36 | "B das design ist abgenommen" (what counts as an intervention: only answers to the factory's questions, or every message in the running session?), after an earlier "ja" that picked neither option | R4, D19, docs/product.md glossary — sharpens L11; no acceptance criterion changed |
