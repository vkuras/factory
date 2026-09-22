# 002 – Find a task

- Type: Feature
- Status: Implemented – ready for validation
- Date: 2026-09-08
- Product context: docs/product.md

## Summary
The list has grown past what fits on a screen, so the team scrolls to find anything. This feature lets a team member type a few letters and see only the matching tasks, and hide the finished ones. It turns the list back into something you can use while standing at the machine with one hand. It matters now because the list has a few hundred entries and people have started keeping their own notes again.

## Users and roles
Unchanged: everyone is a team member and may do everything. Searching changes only what that person sees; it does not change the list for anybody else.

## Stories

### S5 – Find a task by typing
As a team member, I want to type part of a task and see only the tasks that contain it, so that I find one without scrolling.

Acceptance criteria:
- S5.1 Given the list, when I type text into the search field, then I see only tasks whose title contains that text.
- S5.2 Given a task "Buy Milk", when I search for "milk", then I see it. Upper and lower case make no difference.
- S5.3 Given a task "Buy milk", when I search for "milk", then I see it. The text may sit anywhere in the title, not only at its start.
- S5.4 Given text in the search field, when I clear it, then I see the whole list again.
- S5.5 Given text that no task contains, when I search for it, then I see a message that no task matches, and not an empty screen.

Notes: the stakeholder demonstrated this by typing "milk" and expecting "Buy Milk", "Order milk crate" and "Milk bill" to appear. "I never know how somebody wrote it down."

### S6 – Hide what is finished
As a team member, I want to hide the done tasks, so that I see only what is left.

Acceptance criteria:
- S6.1 Given done and open tasks, when I switch on "open only", then I see only tasks that are not done.
- S6.2 Given "open only" is on, when I also search for text, then I see only open tasks that match the text.
- S6.3 Given "open only" is on, when I switch it off, then the done tasks are visible again.

## Business rules
- R4 A search matches when the typed text occurs anywhere in the task's title, comparing without regard to upper and lower case. "milk" matches "Buy Milk", "Order milk crate" and "MILK".
- R5 Searching and filtering only change what the person searching sees. Nothing is stored and nobody else's view changes.

## Quality expectations
- QE5 The list holds up to 500 tasks in daily use, and up to ten people in the room search at the same time. Under that load a search still feels instant: 95 out of 100 searches answer in under half a second.
- QE6 The product keeps running inside the office machine's budget while the team searches: no more than 256 MB of memory, as in 001.
- QE7 Searching is one field above the list. No search page, no button to press.

## Scope
### In scope
S5, S6.
### Later
Searching for a person once tasks have owners, saved searches.
### Out of scope
- Fuzzy or typo-tolerant matching. "Exact letters, just anywhere in the text."
- Searching anything other than the title.
- Sorting options.

## Decisions
- Anywhere in the title, not only at the start: "I never know how somebody wrote it down" (stakeholder).
- Case makes no difference: the team writes titles inconsistently (stakeholder).
- The search runs while typing, with no button (stakeholder).

## Stakeholder technical constraints
None stated beyond those of 001.

## Left to architecture
- How the search is executed so QE5 holds at 500 tasks and 10 people: the product need is the speed; the mechanism is open.

## Glossary
- **Search text**: what a team member types into the search field.
- **Open only**: the filter that hides done tasks.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "The list is too long, people keep their own notes again." | Summary |
| L2 | "I type milk and I want to see everything with milk in it." | S5.1, S5.3, R4 |
| L3 | "I never know how somebody wrote it down." | S5.2, R4, Decisions |
| L4 | "Exact letters, just anywhere in the text." | Out of scope (fuzzy) |
| L5 | "Hide the ticked-off ones." | S6 |
| L6 | "We are ten people and there are a few hundred tasks. It has to stay instant." | QE5 |
| L7 | "One field above the list, no search page." | QE7 |
