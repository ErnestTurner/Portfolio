CREATE TABLE IF NOT EXISTS owner_lab_decisions (
  project TEXT PRIMARY KEY CHECK (project = 'scribble'),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  decision TEXT NOT NULL CHECK (decision IN ('approved','changes_requested','parked')),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 400),
  saved_at INTEGER NOT NULL CHECK (saved_at > 0),
  request_id TEXT NOT NULL UNIQUE CHECK (length(request_id) = 36)
) WITHOUT ROWID;
