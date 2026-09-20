# 0009 – Every runtime, image and library is the newest stable release, pinned exactly

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 SC9 (stakeholder, design review 2026-09-20: "wir sollen nur das neuste nehmen
  sodass keine sichheits lucken drin sind"), SC1 (arm64), QE6

## Context

The stakeholder reviewed the first revision of this design, found Node 22 in it, asked why not 26,
and turned that into a general instruction: take only the newest versions so that no security holes
come in with them. The first revision had picked versions from habit ("Node 22 LTS", "EJS 3",
"Vitest 3") and pinned some of them loosely.

An old version is not automatically insecure, and the newest is not automatically safe. What is
true is that a line in *maintenance* gets critical fixes only, that a line past end-of-life gets
none, and that a version nobody states is whatever the build machine happens to resolve. All three
were present in the first revision.

## Options

### A – Newest stable everywhere, pinned exactly, verified at design time
Every component is checked against its registry on the day of the design, the exact version is
written into the design, and `package.json`, the Dockerfile and the compose file pin it with no
range. A dependency moves when somebody decides it moves.

### B – Newest LTS / "conservative" versions
What the first revision did implicitly. It would have kept Node 24 (Active LTS today), which enters
maintenance four weeks from now — older and shorter-lived than Node 26, and against the
stakeholder's instruction.

### C – Floating ranges (`^`, `latest`) so it stays current by itself
Always newest, and never reproducible: two builds of the same commit differ, a bad release breaks
the Pi at the worst moment, and the arm64 build is the one nobody tests first.

## Decision

Option A. Verified on 2026-09-20 against `registry.npmjs.org`, `hub.docker.com` and
`nodejs.org/dist/index.json`; the full table with each source is the design's §Dependency currency.
Nothing is on a version older than the newest stable one, and no unverified version number is in
the design.

The headline choices: Node **26.9.0** on `node:26.9.0-trixie-slim` (newest line, Active LTS on
2026-10-28, supported to 2029-04-30 — see ADR-0001 for why not 22, 24 or 25), Express **5.2.1**,
EJS **6.0.1**, better-sqlite3 **13.0.3**, TypeScript **7.0.2**, Vitest **5.0.1**, supertest
**7.2.2**, cheerio **1.2.0**, `@fontsource/ibm-plex-*` **5.3.0**, shellcheck **v0.11.0**, Debian
**13 trixie** as the base distribution.

Two pins carry a known risk and are taken anyway, because the alternative is an older version:
Node 26 is Current for another five weeks, and TypeScript 7 is the new native compiler. Both are
exercised by every build and every container start, so a problem appears in build slice 1.

## Consequences

- `package.json` has no `^` and no `~`; the Dockerfile pins a full patch tag; the compose file
  pins no image of its own. T-DEP-1 fails the build if any of that slips.
- better-sqlite3 13 ships N-API prebuilds inside its npm package, so the builder stage needs no
  `python3`, `make` or `g++`. The image gets smaller and the arm64 build faster; T-ARCH-1 fails if
  a source build creeps back in.
- Upgrading is a deliberate commit that updates the design's table as well. There is no renovation
  bot and no `npm outdated` gate in this MVP: one person and four agents maintain this, and an
  automatic upgrade on a Raspberry Pi is a way to break the factory while nobody is watching.
- Any later feature that adds a dependency states its version and the date it was checked, in the
  same table.
