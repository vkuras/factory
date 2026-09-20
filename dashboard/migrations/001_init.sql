-- 001_init: the six tables of the design (docs/architecture/001-agent-factory-dashboard.md, Data model).
-- Forward only: an applied migration is never edited. There is no user, session, role or settings
-- table (ADR-0005), and no table that exists to remove or copy history (R8, SC8).

CREATE TABLE repository (
  project_key   TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  repo_path     TEXT
);

CREATE TABLE ticket (
  project_key         TEXT    NOT NULL REFERENCES repository (project_key),
  number              TEXT    NOT NULL,
  title               TEXT    NOT NULL,
  slug                TEXT,
  requirements_status TEXT,
  agent_status        TEXT,
  first_seen_at       INTEGER NOT NULL,
  last_activity_at    INTEGER NOT NULL,
  validated_at        INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  PRIMARY KEY (project_key, number)
);
CREATE INDEX idx_ticket_activity ON ticket (last_activity_at DESC);
CREATE INDEX idx_ticket_project ON ticket (project_key);

CREATE TABLE run (
  id               TEXT    PRIMARY KEY,
  project_key      TEXT    NOT NULL,
  number           TEXT    NOT NULL,
  actor            TEXT    NOT NULL
                   CHECK (actor IN ('groom', 'architect', 'implementer', 'validator', 'human')),
  started_at       INTEGER NOT NULL,
  ended_at         INTEGER,
  result           TEXT,
  agent_status     TEXT,
  tokens           INTEGER,
  output           TEXT,
  output_truncated INTEGER NOT NULL DEFAULT 0,
  summary          TEXT,
  status_before    TEXT,
  status_after     TEXT,
  source           TEXT    NOT NULL CHECK (source IN ('subagent-hook', 'session-hook', 'cli')),
  tool_use_id      TEXT,
  session_id       TEXT,
  transcript_path  TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  FOREIGN KEY (project_key, number) REFERENCES ticket (project_key, number) ON DELETE CASCADE
);
CREATE INDEX idx_run_ticket ON run (project_key, number, started_at);
CREATE INDEX idx_run_open ON run (ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_run_started ON run (started_at);
CREATE UNIQUE INDEX uq_run_tool_use ON run (tool_use_id) WHERE tool_use_id IS NOT NULL;

CREATE TABLE ticket_status_event (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_key TEXT    NOT NULL,
  number      TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  at          INTEGER NOT NULL,
  run_id      TEXT,
  FOREIGN KEY (project_key, number) REFERENCES ticket (project_key, number)
);
CREATE INDEX idx_status_ticket ON ticket_status_event (project_key, number, at, id);

CREATE TABLE hook_cursor (
  session_id      TEXT    NOT NULL,
  transcript_path TEXT    NOT NULL,
  cum_tokens      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  PRIMARY KEY (session_id, transcript_path)
);

CREATE TABLE schema_migration (
  version    INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  applied_at INTEGER NOT NULL
);
