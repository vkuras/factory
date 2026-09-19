# 0007 – One-time import as a CLI command with a line-based parser for the existing Markdown files

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 S11, R10, LA5, OOS8

## Context
Eight Markdown files in `/Users/vicokuras/IdeaProjects/rezepte` must be imported once, content as written. Their formatting is inconsistent. `##Zutaten` has no space after `#`, so it isn't a valid CommonMark heading. Ingredients are sometimes list items (`* `) and sometimes headings (`# 2 eier`). Steps appear as numbered lists, as plain lines (Entenbrust) and as numbered headings followed by paragraphs (Short Ribs). Sections are unnumbered `###` headings (Pute). Afterwards the repository is no longer used (OOS8).

## Options
### A – Line-based parser in the server module, run as a CLI subcommand of the app image (`import --source <dir> --owner <username> [--dry-run]`) in one DB transaction
The parser is tailored to the real files, and golden tests use copies of all 8 files. It refuses to run a second time.
### B – Generic CommonMark parser (e.g. commonmark-java)
It would misread `##Zutaten` as a paragraph and needs the same special cases on top.
### C – Manual entry or a one-off script outside the product
Manual entry contradicts S11 ("nicht neu eintippen"). An external script can't reuse the shared validation and would bypass the domain rules.

## Decision
A. The exact algorithm is specified in design 001, "Business rules" R10.

## Consequences
- The parser fails loudly (exit code 1, nothing written) on any content it can't place. No content is dropped silently, except the defined `Quelle` section.
- A marker `import.completedAt` in table `app_meta` makes a second run abort (S11.8).
- `--dry-run` prints the parsed recipes for a visual check before the real run.
