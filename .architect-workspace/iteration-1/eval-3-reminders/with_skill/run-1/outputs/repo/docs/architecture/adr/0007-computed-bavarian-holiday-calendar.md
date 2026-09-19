# 0007 – Bavarian holiday calendar computed in code (Easter algorithm), no library, no list

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 R1, R2, R4, R6, QE3, Left to architecture 2

## Context
Working days are Mon–Fri minus 12 statewide Bavarian holidays, 5 of them Easter-dependent. 15 Aug and 8 Aug must **not** be holidays for this business. The calendar must stay correct across years without maintenance.

## Options
### A – Own pure function: fixed dates + Anonymous Gregorian Easter algorithm
~40 lines, fully testable, exactly the 12 days from R1, valid for any Gregorian year.
### B – Library (`date-holidays`, `feiertagejs`)
Maintained, but models Bavaria with regional variants (15 Aug in Catholic municipalities, 8 Aug in Augsburg); getting exactly R1 requires filtering and trusting the library's region semantics across updates.
### C – Hand-maintained list of dates per year
Needs yearly maintenance by someone; silent failure when a year is missing.

## Decision
A. It encodes R1 exactly, has no maintenance and no dependency, and is verified against a table of known dates 2024–2030.

## Consequences
- A change to the holiday set (e.g. adding 15 Aug) is a one-line code change plus tests.
- Easter-based offsets: Good Friday −2, Easter Monday +1, Ascension +39, Whit Monday +50, Corpus Christi +60.
