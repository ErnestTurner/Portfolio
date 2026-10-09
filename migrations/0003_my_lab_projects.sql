CREATE TABLE IF NOT EXISTS owner_lab_projects (
  project TEXT PRIMARY KEY
    CHECK (length(project) BETWEEN 2 AND 48)
    CHECK (project NOT GLOB '*[^a-z0-9_]*'),
  sort_order INTEGER NOT NULL CHECK (sort_order BETWEEN 0 AND 1000),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  kind TEXT NOT NULL CHECK (length(kind) BETWEEN 1 AND 40),
  state TEXT NOT NULL CHECK (state IN ('review','testing','published','status_check','ideas')),
  state_label TEXT NOT NULL CHECK (length(state_label) BETWEEN 1 AND 80),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  latest_result TEXT NOT NULL DEFAULT '' CHECK (length(latest_result) <= 500),
  lead TEXT NOT NULL CHECK (length(lead) BETWEEN 1 AND 100),
  blocker TEXT NOT NULL DEFAULT '' CHECK (length(blocker) <= 400),
  evidence TEXT NOT NULL DEFAULT '' CHECK (length(evidence) <= 200),
  evidence_verified_at TEXT NOT NULL DEFAULT '' CHECK (length(evidence_verified_at) <= 32),
  preview_url TEXT NOT NULL DEFAULT '' CHECK (length(preview_url) <= 240),
  source_url TEXT NOT NULL DEFAULT '' CHECK (length(source_url) <= 300),
  work_chat_url TEXT NOT NULL DEFAULT '' CHECK (length(work_chat_url) <= 300),
  source_revision TEXT NOT NULL DEFAULT '' CHECK (length(source_revision) <= 64),
  decision_question TEXT NOT NULL DEFAULT '' CHECK (length(decision_question) <= 400),
  recommendation TEXT NOT NULL DEFAULT '' CHECK (length(recommendation) <= 400),
  scope TEXT NOT NULL DEFAULT '' CHECK (length(scope) <= 300),
  review_prompt TEXT NOT NULL DEFAULT '' CHECK (length(review_prompt) <= 500),
  feedback_prompts_json TEXT NOT NULL DEFAULT '[]' CHECK (length(feedback_prompts_json) <= 1000),
  review_checklist_json TEXT NOT NULL DEFAULT '[]' CHECK (length(review_checklist_json) <= 2000),
  updated_at INTEGER NOT NULL CHECK (updated_at > 0)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS owner_lab_projects_state_order
  ON owner_lab_projects (state, sort_order, project);

CREATE TABLE IF NOT EXISTS owner_lab_decisions_next (
  project TEXT PRIMARY KEY
    CHECK (length(project) BETWEEN 2 AND 48)
    CHECK (project NOT GLOB '*[^a-z0-9_]*'),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  decision TEXT NOT NULL CHECK (decision IN ('approved','changes_requested','parked')),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 400),
  saved_at INTEGER NOT NULL CHECK (saved_at > 0),
  request_id TEXT NOT NULL UNIQUE CHECK (length(request_id) = 36)
) WITHOUT ROWID;

INSERT OR IGNORE INTO owner_lab_decisions_next(project,revision,decision,note,saved_at,request_id)
SELECT project,revision,decision,note,saved_at,request_id FROM owner_lab_decisions;

DROP TABLE owner_lab_decisions;
ALTER TABLE owner_lab_decisions_next RENAME TO owner_lab_decisions;
