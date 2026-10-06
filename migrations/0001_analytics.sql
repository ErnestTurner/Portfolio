CREATE TABLE IF NOT EXISTS analytics_events (
  bucket_start INTEGER NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('production','preview','test')),
  event TEXT NOT NULL,
  experiment TEXT NOT NULL,
  source TEXT NOT NULL,
  format TEXT NOT NULL,
  release TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (bucket_start, context, event, experiment, source, format, release)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS analytics_events_context_time
  ON analytics_events (context, bucket_start);

CREATE TABLE IF NOT EXISTS ingest_windows (
  window_start INTEGER PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count >= 0 AND count <= 300)
) WITHOUT ROWID;

CREATE TRIGGER IF NOT EXISTS analytics_retention
AFTER INSERT ON analytics_events
BEGIN
  DELETE FROM analytics_events WHERE bucket_start < unixepoch() - 7776000;
  DELETE FROM ingest_windows WHERE window_start < unixepoch() - 172800;
END;
