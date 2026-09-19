# Coverage checklist

This is a thinking aid for finding gaps before the alignment walkthrough. Don't recite it to the stakeholder. Most features only touch some of these areas. For each area that applies, ask yourself: could the architect build this without guessing?

## Why and who
- What problem does this solve, and what happens today without it?
- Who uses it? Are there several roles with different permissions?
- In what situation do they use it (device, place, time pressure, frequency)?
- How will the stakeholder know it's a success?

## Behaviour
- The main flow as a concrete scenario, step by step from the user's view.
- The first-time experience: empty states, the first use, the first data.
- Variations: what differs by role, by amount of data, over time?
- Failures as the user experiences them: invalid input, something missing, a conflicting action, an interruption, doing the same thing twice.
- Undo, edit, delete: can the user take things back, and what happens to anything that depended on it?
- Notifications and feedback: when does the user learn that something happened?

## Rules and data (in business terms)
- Calculations, limits, thresholds, rounding, units. Get concrete numbers and examples.
- States that things go through (draft, active, done...) and who can move them.
- What information the user enters, sees and can search or sort by, in their words.
- Ownership and visibility: who can see or change whose things?
- Existing data: does anything already exist that has to be brought in, and in what form does the stakeholder have it today?

## Boundaries
- What is explicitly not part of this?
- Which "later" ideas were mentioned, and are they truly later?
- For an MVP: what is the smallest version that still proves the core value?
- For a feature: does it contradict or change any existing requirement or term in product.md?

## Quality in user terms
- Speed as the user perceives it, availability (e.g. no internet connection), devices.
- Privacy and trust expectations.
- Languages, accessibility, legal or regulatory needs the stakeholder knows of.
