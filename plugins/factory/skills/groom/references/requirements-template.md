# Requirements document template

Use this structure for `docs/requirements/NNN-<slug>.md`. Drop a section only if it truly has nothing in it. For example, keep "Out of scope" even for a tiny feature, because stating what's excluded prevents the architect from building it. Write for a reader who was not in the conversation: the architect agent only has this file and `docs/product.md`.

```markdown
# NNN – <Feature or MVP name>

- Type: MVP | Feature
- Status: Groomed – ready for architecture
- Date: YYYY-MM-DD
- Product context: docs/product.md

## Summary
Three to five sentences: the problem, who has it, what changes for them once this exists, and why it matters now.

## Users and roles
Who interacts with this feature and what each role may do, in business terms.

## Stories
Group related stories. Each story:

### S1 – <short title>
As a <role>, I want <capability>, so that <benefit>.

Acceptance criteria:
- Given <situation>, when <user action or event>, then <observable outcome>.
- ...cover the normal case, the relevant edge cases and what the user experiences when something fails.

Notes: optional context that helps interpret the story (examples the stakeholder gave, reasons behind a rule).

## Business rules
Rules that apply across stories, each with an ID (R1, R2, ...) so stories can reference them. Include concrete numbers and examples where the stakeholder gave them.

## Quality expectations
Non-functional expectations stated in user terms (responsiveness as the user perceives it, devices and situations of use, privacy expectations, languages, accessibility). No technical mechanisms.

## Scope
### In scope
Short list of story IDs or capabilities.
### Later
Parked ideas the stakeholder wants eventually, but not in this increment.
### Out of scope
Things that were explicitly excluded and should not be built.

## Decisions
One line each: the decision, the reason, and who made it (stakeholder, or groomer proposal accepted by the stakeholder). This tells the architect which points are firm and why.

## Stakeholder technical constraints
Verbatim technical preferences the stakeholder stated, each with a short note of context. These are givens for the architect, not requirements designed by the groomer. Write "None stated." if empty.

## Left to architecture
Technical questions that surfaced during grooming and were deliberately not decided, each with the product need behind it (e.g. "Offline capability: the product need is that recipes stay readable in the kitchen without reception (S4); how to achieve it is open."). This section marks the omissions as deliberate so they don't look like oversights.

## Glossary
Domain terms used in this document, unless they are already defined in docs/product.md.

## Open questions
Should be "None." A groomed document hands over no open product questions.

## Appendix: Stakeholder input trace
Every ledger item: the near-verbatim statement and where it went.
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "..." | S1, R2 |
| L2 | "..." | Later |
```
