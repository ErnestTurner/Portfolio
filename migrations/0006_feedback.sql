CREATE TABLE IF NOT EXISTS owner_feedback (
  feedback_id TEXT PRIMARY KEY CHECK(length(feedback_id)=36),
  request_id TEXT NOT NULL UNIQUE CHECK(length(request_id)=36),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2000),
  name TEXT NOT NULL DEFAULT '' CHECK(length(name)<=80),
  page TEXT NOT NULL DEFAULT '' CHECK(length(page)<=120),
  happened TEXT NOT NULL DEFAULT '' CHECK(length(happened)<=1000),
  expected TEXT NOT NULL DEFAULT '' CHECK(length(expected)<=1000),
  reproduction TEXT NOT NULL DEFAULT '' CHECK(length(reproduction)<=1500),
  context TEXT NOT NULL CHECK(context IN ('test','production')),
  created_at INTEGER NOT NULL CHECK(created_at>0)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS owner_feedback_created ON owner_feedback(created_at DESC,feedback_id DESC);

CREATE TABLE IF NOT EXISTS feedback_ingest_windows (
  window_start INTEGER PRIMARY KEY CHECK(window_start>0),
  count INTEGER NOT NULL CHECK(count BETWEEN 1 AND 20)
) WITHOUT ROWID;
