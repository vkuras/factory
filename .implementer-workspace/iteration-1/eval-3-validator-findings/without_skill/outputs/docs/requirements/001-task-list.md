# 001 – Task list

- Type: MVP
- Status: Validated
- Date: 2026-08-14
- Product context: docs/product.md

## Summary
The team has no shared place for the small jobs that come up during the day. This MVP gives them one list that everyone in the room can open on their phone or laptop, add an item to, tick off and delete. It replaces the whiteboard, and it is deliberately the smallest thing that does so: no accounts, no due dates, no categories. It matters now because the team loses items every week and notices it only when a customer asks.

## Users and roles
Every person in the team is a **team member** and may do everything: see the list, add tasks, mark tasks as done and delete tasks. There are no other roles and no accounts.

## Stories

### S1 – Add a task
As a team member, I want to write down a task in one step, so that it is not forgotten.

Acceptance criteria:
- S1.1 Given the list is open, when I enter a title and submit it, then the task appears in the list as not done.
- S1.2 Given the title is empty or only spaces, when I submit it, then the task is not created and I see a message that a title is required.
- S1.3 Given a title longer than 200 characters, when I submit it, then the task is not created and I see a message about the length.

Notes: the stakeholder wants nothing else on the form. "One field and a button, otherwise nobody uses it."

### S2 – See the list
As a team member, I want to see all tasks, so that I know what is open.

Acceptance criteria:
- S2.1 Given several open tasks exist, when I open the list, then I see all of them, the most recently added first.
- S2.2 Given no tasks exist, when I open the list, then I see a message that there are no tasks yet.

### S3 – Mark a task as done
As a team member, I want to tick off a task, so that the others can see it is finished.

Acceptance criteria:
- S3.1 Given an open task, when I mark it as done, then it is shown as done to everyone who opens the list afterwards.
- S3.2 Given done and open tasks exist, when I open the list, then done tasks are shown below the open ones and are visibly struck through.

### S4 – Delete a task
As a team member, I want to remove a task, so that mistakes and obsolete items disappear.

Acceptance criteria:
- S4.1 Given a task exists, when I delete it, then it is gone from the list for everyone.
- S4.2 Given a task that no longer exists, when it is deleted again, then the product reports that the task does not exist and stays usable.

## Business rules
- R1 A title is trimmed of surrounding spaces, must not be empty afterwards, and must not be longer than 200 characters.
- R2 Tasks survive a restart of the product. The list is the team's memory: losing it is worse than being unavailable for a while.
- R3 Everyone sees the same single list. There is no per-person view.

## Quality expectations
- QE1 Usable on a phone held in one hand while standing: the list and the form work in portrait on a phone screen, and the things you tap are big enough to hit without aiming.
- QE2 Runs on the team's own small office machine (4 GB of RAM, shared with other things) and starts with one command.
- QE3 The interface language is English.
- QE4 Opening the list and adding a task feel instant on the office network, well under a second.

## Scope
### In scope
S1, S2, S3, S4.
### Later
Due dates, who is doing what, search.
### Out of scope
- User accounts, login, roles and permissions.
- More than one list.
- Notifications of any kind (email, push, chat).

## Decisions
- No accounts: the team sits in one room and trusts each other (stakeholder).
- One shared list rather than per-person lists: the whiteboard was shared too (stakeholder).
- Deleting is immediate, with no confirmation and no undo: "it is four words, you can type them again" (stakeholder).

## Stakeholder technical constraints
- "It has to run on the little machine in the office, not in some cloud." The product is self-hosted on the team's own hardware.
- "I want to start it with one command." The stakeholder deploys it themselves and is not a developer.

## Left to architecture
- How tasks are stored so R2 holds: the product need is that the list survives restarts; the mechanism is open.

## Glossary
See docs/product.md.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "We lose stuff every week, the whiteboard gets wiped." | Summary, R2 |
| L2 | "One field and a button, otherwise nobody uses it." | S1, Notes |
| L3 | "Everybody sees the same list, we sit in one room." | R3, Decisions |
| L4 | "I tick it off on my phone while standing at the printer." | QE1 |
| L5 | "It has to run on the little machine in the office." | QE2, Stakeholder technical constraints |
| L6 | "Due dates later, first the plain list." | Later |
| L7 | "No logins. Please." | Out of scope, Decisions |
