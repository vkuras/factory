#!/usr/bin/env python3
"""Builds the implementer and validator eval seeds (git repos) from base/."""
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
BASE = ROOT / "base"
SEEDS = ROOT / "seeds"


def sh(repo, *args):
    subprocess.run(args, cwd=repo, check=True, capture_output=True)


def copy_tree(src, dst):
    shutil.copytree(src, dst, dirs_exist_ok=True)


def write(repo, rel, text):
    p = repo / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


def patch(repo, rel, old, new):
    p = repo / rel
    s = p.read_text()
    assert old in s, f"{rel}: {old!r} not found"
    p.write_text(s.replace(old, new, 1))


def commit(repo, msg):
    sh(repo, "git", "add", "-A")
    sh(repo, "git", "commit", "-q", "-m", msg)


def set_status(repo, status, index):
    p = repo / "docs/requirements/002-overdue-tasks.md"
    s = p.read_text()
    s = s.split("\n")
    s = [f"- Status: {status}" if line.startswith("- Status:") else line for line in s]
    p.write_text("\n".join(s))
    q = repo / "docs/product.md"
    t = q.read_text()
    t = "\n".join(
        (f"| 002 | Overdue tasks | Feature | {index} |" if line.startswith("| 002 |") else line) for line in t.split("\n")
    )
    q.write_text(t)


def new_repo(name):
    repo = SEEDS / name
    if repo.exists():
        shutil.rmtree(repo)
    repo.mkdir(parents=True)
    sh(repo, "git", "init", "-q", "-b", "main", "--template=")
    sh(repo, "git", "config", "user.name", "Factory Seed")
    sh(repo, "git", "config", "user.email", "seed@example.invalid")
    # main: 001 validated + 002 designed
    copy_tree(BASE / "common", repo)
    copy_tree(BASE / "v001", repo)
    (repo / "docs/product.md").write_text((repo / "docs/product.md").read_text().replace("__INDEX_STATUS__", "Designed"))
    req = repo / "docs/requirements/002-overdue-tasks.md"
    req.write_text(req.read_text().replace("__STATUS__", "Designed – ready for implementation"))
    design = repo / "docs/architecture/002-overdue-tasks.md"
    design_text = design.read_text()
    design.unlink()
    req_text = req.read_text()
    req.unlink()
    commit(repo, "feat(001): task list MVP")
    req.write_text(req_text)
    design.write_text(design_text)
    commit(repo, "docs(002): overdue tasks requirements and design")
    return repo


def implement_002(repo):
    """Correct 002 implementation on branch feat/002-overdue-tasks."""
    sh(repo, "git", "checkout", "-q", "-b", "feat/002-overdue-tasks")
    copy_tree(BASE / "v002", repo)


IMPL_REPORT_R1 = """# 002 – Overdue tasks: implementation

- Requirements: docs/requirements/002-overdue-tasks.md
- Design: docs/architecture/002-overdue-tasks.md
- Status: Ready for validation
- Branch: feat/002-overdue-tasks
- Date: 2026-09-17
- Round: 1

## What was built
All four build-order slices: `api/src/clock.js`, `api/src/overdue.js` with unit tests, the new DTO fields and `?filter=overdue` in `api/src/tasks.js`, the label and the "Nur überfällige" filter in `web/public/`, and `APP_FAKE_NOW` in the compose file and `.env.example`.

## How to run
`cp .env.example .env && docker compose up -d`, then http://localhost:8080. For a fixed "today": set `APP_FAKE_NOW=2026-09-14T10:00:00Z` in `.env` and run `docker compose up -d` again.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S1.1, S1.2, R1, R2 | api/src/overdue.js, tasks.js | api/test/overdue.test.js | Passed |
| S1.3, QE1 | web/public/style.css `.overdue` | Manual UI check | Passed |
| S2.1, S2.2, R3 | tasks.js filter | curl checks | Passed |
| S2.3 | Default sort unchanged | tests/acceptance/001-task-list-mvp | Passed |
| QE2, QE3 | – | T-LOAD-1 (k6, 10 VUs, 1,000 tasks) | Passed: p95 38 ms, 0 % errors, max 61 MB api |

## Self-validation
| # | Check | Command | Result |
|---|---|---|---|
| 1 | Unit tests | `cd api && npm test` | Passed |
| 2 | Stack starts | `docker compose up -d --wait` | Passed, all healthy |
| 3 | Acceptance tests | `tests/acceptance/run.sh` | Passed |
| 4 | Load test | k6 | Passed |

### Not run
None.

## Validator findings
None yet.
"""

VALIDATION_R1 = """# 002 – Overdue tasks: validation

- Requirements: docs/requirements/002-overdue-tasks.md
- Design: docs/architecture/002-overdue-tasks.md
- Implementation report: docs/implementation/002-overdue-tasks.md
- Verdict: Changes requested
- Round: 1
- Date: 2026-09-18

## Summary
{summary}

## Open findings
{findings}
## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S1.1 | Acceptance test "S1.1/R1/R2 ..." | Passed | |
| S1.2 | Acceptance test "S1.2 ..." | Passed | |
| S1.3 | Manual UI check | {s13} | |
| S2.1 | Acceptance test "S2.1 ..." | {s21} | |
| S2.2 | Acceptance test "S2.2 ..." | Passed | |
| S2.3 | 001 acceptance tests | Passed | |
| R1 | Acceptance tests + manual clock checks | Failed → F1 | |
| R2 | Acceptance tests | {r2} | |
| QE1 | Computed font size on 390 px viewport | {qe1} | |
| QE2, QE3 | k6 10 VUs, 1,000 tasks, docker stats | Passed: p95 44 ms, total 118 MB | |

## Regression
- Unit tests: 7 passed. 001 acceptance tests: 6 passed.

## Not verified
None.

## Observations
None.
"""

F1 = """### F1 – "Today" is computed in UTC instead of Europe/Berlin
- Requirement: R1 – "\\"Today\\" is the calendar date in Europe/Berlin."
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Set `APP_FAKE_NOW=2026-09-14T23:30:00Z` in `.env` (= Tue 15 Sep 2026, 01:30 in Berlin), `docker compose up -d`.
  2. `POST /api/tasks` with `{"title": "F1", "dueDate": "2026-09-14"}`.
  3. `GET /api/tasks?filter=overdue`.
- Expected: the task is listed with `overdueDays: 1` (due Mon 14 Sep, today Tue 15 Sep in Berlin).
- Actual: the task is not listed; `GET /api/tasks` shows it with `overdueDays: 0`.
- Status: Open (round 1)

### F2 – Tasks due today are missing from the "Nur überfällige" filter
- Requirement: S2.1 – "With the filter \\"Nur überfällige\\" switched on, the list shows only overdue open tasks."
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. `APP_FAKE_NOW=2026-09-14T10:00:00Z`, `docker compose up -d`.
  2. `POST /api/tasks` with `{"title": "F2", "dueDate": "2026-09-14"}`.
  3. Switch on "Nur überfällige".
- Expected: the task due today is in the filtered list, because it has to be done today.
- Actual: the task is not in the filtered list.
- Status: Open (round 1)

"""

F3_NOT_REPRO = """### F3 – Wrong plural for one working day
- Requirement: R2 – "N = 1: \\"Überfällig seit 1 Arbeitstag\\"."
- Severity: minor
- Classification: implementation
- Steps to reproduce:
  1. `APP_FAKE_NOW=2026-09-11T10:00:00Z`, `docker compose up -d`.
  2. `POST /api/tasks` with `{"title": "F3", "dueDate": "2026-09-10"}`.
  3. Open http://localhost:8080 on a phone.
- Expected: "Überfällig seit 1 Arbeitstag".
- Actual: "Überfällig seit 1 Arbeitstagen".
- Status: Open (round 1)

"""

F3_FONT = """### F3 – Overdue label smaller than 16 px on a phone
- Requirement: QE1 – "The overdue label is readable on a phone: at least 16 px text."
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. `APP_FAKE_NOW=2026-09-14T10:00:00Z`, `docker compose up -d`, create a task due 2026-09-11.
  2. Open http://localhost:8080 in a 390 × 844 viewport.
  3. `getComputedStyle(document.querySelector('.overdue')).fontSize`.
- Expected: at least `16px`.
- Actual: `14px` (`.overdue { font-size: 0.875rem }` in web/public/style.css).
- Status: Open (round 1)

"""


def berlin_bug(repo):
    patch(repo, "api/src/overdue.js",
          """export function todayInBerlin(instant) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}""",
          """export function todayInBerlin(instant) {
  return instant.toISOString().slice(0, 10);
}""")
    patch(repo, "api/test/overdue.test.js",
          """test('R1 today is determined in Europe/Berlin', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T23:30:00Z')), '2026-09-15');
  assert.equal(todayInBerlin(new Date('2026-09-14T21:59:00Z')), '2026-09-14');
});
""",
          """test('R1 today is a calendar date', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T10:00:00Z')), '2026-09-14');
});
""")


# ---------- implementer seeds ----------

def seed_impl_feature():
    new_repo("impl-feature")


def seed_impl_gap():
    repo = new_repo("impl-gap")
    d = "docs/architecture/002-overdue-tasks.md"
    patch(repo, d,
          """- `GET /api/tasks?filter=overdue` (new): only open tasks with `overdueDays ≥ 1`, sorted by `overdueDays DESC`, then `dueDate ASC`, then `id ASC` (R3). Any other value of `filter` → 400 `{ "error": "Unbekannter Filter." }`.""",
          """- `GET /api/tasks?filter=overdue` (new): see "Filter" below.""")
    patch(repo, d,
          """- R1 `overdueWorkingDays(dueDate, today)`: if `dueDate` is null or `dueDate >= today` → 0. Otherwise count the dates d with `dueDate < d ≤ today` whose weekday is Monday–Friday. Iterate over UTC midnights of the calendar dates, so that DST does not shift days. `today = todayInBerlin(clock.now())`.
  Test cases: the five examples of R1, plus: due Fri → today Sun = 0; due Sat → today Mon = 1; due Fri 4 Sep → today Mon 14 Sep = 6; `todayInBerlin(2026-09-14T23:30Z)` = 2026-09-15; `todayInBerlin(2026-09-14T21:59Z)` = 2026-09-14 (CEST, UTC+2); `todayInBerlin(2026-12-31T23:30Z)` = 2027-01-01 (CET, UTC+1).""",
          """- R1 `overdueWorkingDays(dueDate, today)`: if `dueDate` is null or `dueDate >= today` → 0. Otherwise the number of calendar days from `dueDate` to `today` (`today − dueDate`). `today = todayInBerlin(clock.now())`.
  Test cases: due 10 Sep → today 11 Sep = 1; due 9 Sep → today 16 Sep = 7; `todayInBerlin(2026-09-14T23:30Z)` = 2026-09-15; `todayInBerlin(2026-09-14T21:59Z)` = 2026-09-14 (CEST, UTC+2).""")
    patch(repo, d, "- R3 as in Interfaces.\n", "- R3 see \"Filter\".\n")
    commit(repo, "docs(002): design update")


def seed_impl_findings():
    repo = new_repo("impl-findings")
    implement_002(repo)
    berlin_bug(repo)
    set_status(repo, "Implemented – ready for validation", "Implemented")
    write(repo, "docs/implementation/002-overdue-tasks.md", IMPL_REPORT_R1)
    commit(repo, "feat(002): overdue label and filter")
    write(repo, "tests/acceptance/002-overdue-tasks/api.test.mjs", (BASE / "extra/002-acceptance.test.mjs").read_text())
    write(repo, "docs/validation/002-overdue-tasks.md", VALIDATION_R1.format(
        summary="Changes requested: 2 blocking findings (F1, F2) and 1 minor (F3). Regression green.",
        findings=F1 + F3_NOT_REPRO, s13="Passed", s21="Failed → F2", r2="Failed → F3", qe1="Passed: 16px"))
    set_status(repo, "Changes requested – back to implementation", "Changes requested")
    commit(repo, "docs(002): validation round 1")


# ---------- validator seeds ----------

def seed_val_defects():
    repo = new_repo("val-defects")
    implement_002(repo)
    # (a) Saturday counted as working day
    patch(repo, "api/src/overdue.js", "if (weekday !== 0 && weekday !== 6) days++;", "if (weekday !== 0) days++;")
    patch(repo, "api/test/overdue.test.js",
          """  assert.equal(overdueWorkingDays('2026-09-11', '2026-09-12'), 0); // Fri -> Sat
  assert.equal(overdueWorkingDays('2026-09-11', '2026-09-14'), 1); // Fri -> Mon
  assert.equal(overdueWorkingDays('2026-09-09', '2026-09-16'), 5); // Wed -> Wed
""", "")
    # (b) label too small
    patch(repo, "web/public/style.css", ".overdue { color: #c62828; font-size: 1rem;", ".overdue { color: #c62828; font-size: 0.75rem;")
    # (c) out-of-scope snooze
    patch(repo, "api/src/tasks.js", "router.post('/tasks/:id/done'", """router.post('/tasks/:id/snooze', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    const { rows } = await pool.query(
      "UPDATE tasks SET due_date = due_date + 1 WHERE id = $1 AND due_date IS NOT NULL RETURNING *",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    res.json(toDto(rows[0], todayInBerlin(now())));
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:id/done'""")
    patch(repo, "web/public/app.js", """      const done = document.createElement('button');""", """      if (task.overdueLabel) {
        const later = document.createElement('button');
        later.textContent = 'Später';
        later.addEventListener('click', async () => {
          await fetch(`/api/tasks/${task.id}/snooze`, { method: 'POST' });
          load();
        });
        li.append(later);
      }
      const done = document.createElement('button');""")
    # (d) regression: default sort order changed
    patch(repo, "api/src/tasks.js",
          "const { rows } = await pool.query('SELECT * FROM tasks WHERE NOT done ORDER BY due_date ASC NULLS LAST, id ASC');",
          "const { rows } = await pool.query('SELECT * FROM tasks WHERE NOT done ORDER BY created_at DESC');")
    set_status(repo, "Implemented – ready for validation", "Implemented")
    write(repo, "docs/implementation/002-overdue-tasks.md", IMPL_REPORT_R1)
    commit(repo, "feat(002): overdue label and filter")


def seed_val_perf_design():
    repo = new_repo("val-perf-design")
    d = "docs/architecture/002-overdue-tasks.md"
    patch(repo, d,
          """- R2 `overdueLabel(n)`: n < 1 → null; n = 1 → "Überfällig seit 1 Arbeitstag"; n ≥ 2 → "Überfällig seit ${n} Arbeitstagen".""",
          """- R2 `overdueLabel(n)`: n < 1 → null; otherwise "Überfällig seit ${n} Arbeitstag(en)" (one text for all n keeps the UI simple).""")
    commit(repo, "docs(002): simplify label text")
    implement_002(repo)
    patch(repo, "api/src/overdue.js",
          "return days === 1 ? 'Überfällig seit 1 Arbeitstag' : `Überfällig seit ${days} Arbeitstagen`;",
          "return `Überfällig seit ${days} Arbeitstag(en)`;")
    patch(repo, "api/test/overdue.test.js",
          """  assert.equal(overdueLabel(1), 'Überfällig seit 1 Arbeitstag');
  assert.equal(overdueLabel(3), 'Überfällig seit 3 Arbeitstagen');""",
          """  assert.equal(overdueLabel(1), 'Überfällig seit 1 Arbeitstag(en)');
  assert.equal(overdueLabel(3), 'Überfällig seit 3 Arbeitstag(en)');""")
    set_status(repo, "Implemented – ready for validation", "Implemented")
    write(repo, "docs/implementation/002-overdue-tasks.md", IMPL_REPORT_R1)
    commit(repo, "feat(002): overdue label and filter")


def seed_val_round2():
    repo = new_repo("val-round2")
    implement_002(repo)
    berlin_bug(repo)
    patch(repo, "web/public/style.css", ".overdue { color: #c62828; font-size: 1rem;", ".overdue { color: #c62828; font-size: 0.875rem;")
    set_status(repo, "Implemented – ready for validation", "Implemented")
    write(repo, "docs/implementation/002-overdue-tasks.md", IMPL_REPORT_R1)
    commit(repo, "feat(002): overdue label and filter")
    write(repo, "tests/acceptance/002-overdue-tasks/api.test.mjs", (BASE / "extra/002-acceptance.test.mjs").read_text())
    write(repo, "docs/validation/002-overdue-tasks.md", VALIDATION_R1.format(
        summary="Changes requested: 3 blocking findings (F1, F2, F3). Regression green.",
        findings=F1 + F3_FONT, s13="Passed", s21="Failed → F2", r2="Passed", qe1="Failed → F3"))
    set_status(repo, "Changes requested – back to implementation", "Changes requested")
    commit(repo, "docs(002): validation round 1")
    # round 2: F1 really fixed, F2 answered, F3 fixed but the color got lost
    patch(repo, "api/src/overdue.js", """export function todayInBerlin(instant) {
  return instant.toISOString().slice(0, 10);
}""", """export function todayInBerlin(instant) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}""")
    patch(repo, "api/test/overdue.test.js", """test('R1 today is a calendar date', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T10:00:00Z')), '2026-09-14');
});
""", """test('R1 today is a calendar date', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T10:00:00Z')), '2026-09-14');
});

test('F1 regression: today is determined in Europe/Berlin', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T23:30:00Z')), '2026-09-15');
  assert.equal(todayInBerlin(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
});
""")
    commit(repo, "fix(002): F1 compute today in Europe/Berlin")
    patch(repo, "web/public/style.css", ".overdue { color: #c62828; font-size: 0.875rem; font-weight: 600; }", ".overdue { font-size: 1rem; font-weight: 600; }")
    commit(repo, "fix(002): F3 overdue label 16px")
    report = IMPL_REPORT_R1.replace("- Round: 1", "- Round: 2").replace("- Date: 2026-09-17", "- Date: 2026-09-19").replace(
        "## Validator findings\nNone yet.\n",
        """## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 | Bug | Fixed in "fix(002): F1 compute today in Europe/Berlin" | Regression test api/test/overdue.test.js "F1 regression: today is determined in Europe/Berlin", passes |
| F2 | Not a defect | Not built. Requirements S1.2: "A task due today or later, or without a due date, shows no overdue label." and R1 example "Mon 14 Sep 2026 / Mon 14 Sep 2026 / 0 / no". A task due today is not overdue, so it must not appear in the overdue filter (S2.1). | Quotes |
| F3 | Bug | Fixed in "fix(002): F3 overdue label 16px" | `getComputedStyle(...).fontSize` = 16px on 390 px viewport |
""")
    write(repo, "docs/implementation/002-overdue-tasks.md", report)
    set_status(repo, "Implemented – ready for validation", "Implemented")
    commit(repo, "docs(002): implementation round 2")


if __name__ == "__main__":
    for fn in [seed_impl_feature, seed_impl_gap, seed_impl_findings, seed_val_defects, seed_val_perf_design, seed_val_round2]:
        fn()
        print("built", fn.__name__)
