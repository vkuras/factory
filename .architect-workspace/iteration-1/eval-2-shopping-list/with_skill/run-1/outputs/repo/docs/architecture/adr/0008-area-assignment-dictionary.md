# 0008 – Automatic area assignment with household corrections, a built-in German keyword dictionary and a Sonstiges fallback

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 S3.2, S5.1–S5.4, R4, R5, Left to architecture 1

## Context
Every added line (recipe ingredient or free item) must land in one of six fixed areas without the user choosing; unknown items go to "Sonstiges"; a member's manual move must be remembered for the whole household and take priority for every later item with the same name (case-insensitive). Everything runs on the Pi; the UI is German; item names are short German words or phrases ("rote Zwiebeln", "2x Milch", "Vollmilch").

## Options
### A – Corrections table + static dictionary + word-suffix matching
Deterministic, testable, zero runtime cost, fits German compounds ("Vollmilch" → "milch"). Needs a hand-written dictionary of a few hundred entries.
### B – External AI/categorisation API
Better coverage of rare items, but an external service with privacy, cost and failure modes, contradicting "everything on the Pi".
### C – Local ML model on the Pi
Memory and complexity out of proportion for six categories and 2–4 users.
### D – Corrections only (everything starts in Sonstiges)
Simplest, but fails S5.1's "sensible grouping without manual choice" until the household has corrected every item.

## Decision
A, with lookup order: household correction (exact name key) → dictionary exact → longest dictionary suffix match on a word → Sonstiges. Corrections come first, so the household's choices always win (R5).

## Consequences
- The dictionary `backend/src/main/resources/shopping/areas-de.tsv` is part of the code base and covered by a lint test; improving it requires a release.
- Misclassifications are fixed once per household by moving the line.
- Corrections are never deleted; there is no UI to list them (not required).
- Revisit if the household reports frequent wrong areas after corrections, which would point to extending the dictionary, not to a new mechanism.
