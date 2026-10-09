ALTER TABLE owner_lab_decisions ADD COLUMN queued_delivery_id TEXT DEFAULT NULL
  CHECK (queued_delivery_id IS NULL OR length(queued_delivery_id) = 36);

ALTER TABLE owner_lab_projects ADD COLUMN delivery_destination_type TEXT NOT NULL DEFAULT 'unassigned'
  CHECK (delivery_destination_type IN ('unassigned','slack_thread'));

ALTER TABLE owner_lab_projects ADD COLUMN delivery_destination_ref TEXT NOT NULL DEFAULT ''
  CHECK (length(delivery_destination_ref) <= 300);

CREATE TABLE owner_lab_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 36),
  record_type TEXT NOT NULL CHECK (record_type IN ('owner_decision','synthetic_test')),
  project TEXT NOT NULL
    CHECK (length(project) BETWEEN 2 AND 48)
    CHECK (project NOT GLOB '*[^a-z0-9_]*'),
  project_name TEXT NOT NULL CHECK (length(project_name) BETWEEN 1 AND 80),
  decision_revision INTEGER NOT NULL CHECK (decision_revision >= 1),
  decision TEXT NOT NULL CHECK (decision IN ('approved','changes_requested','parked','delivery_test')),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 400),
  scope TEXT NOT NULL CHECK (length(scope) BETWEEN 1 AND 300),
  source_revision TEXT NOT NULL DEFAULT '' CHECK (length(source_revision) <= 64),
  source_request_id TEXT CHECK (source_request_id IS NULL OR length(source_request_id) = 36),
  destination_type TEXT NOT NULL CHECK (destination_type IN ('unassigned','slack_thread')),
  destination_ref TEXT NOT NULL DEFAULT '' CHECK (length(destination_ref) <= 300),
  status TEXT NOT NULL CHECK (status IN ('queued','delivered','accepted','completed')),
  queued_at INTEGER NOT NULL CHECK (queued_at > 0),
  delivered_at INTEGER,
  delivered_receipt_id TEXT NOT NULL DEFAULT '' CHECK (length(delivered_receipt_id) <= 80),
  delivered_receipt_url TEXT NOT NULL DEFAULT '' CHECK (length(delivered_receipt_url) <= 300),
  accepted_at INTEGER,
  accepted_by TEXT NOT NULL DEFAULT '' CHECK (length(accepted_by) <= 100),
  accepted_note TEXT NOT NULL DEFAULT '' CHECK (length(accepted_note) <= 400),
  accepted_receipt_id TEXT NOT NULL DEFAULT '' CHECK (length(accepted_receipt_id) <= 80),
  accepted_receipt_url TEXT NOT NULL DEFAULT '' CHECK (length(accepted_receipt_url) <= 300),
  completed_at INTEGER,
  completion_note TEXT NOT NULL DEFAULT '' CHECK (length(completion_note) <= 500),
  completion_receipt_id TEXT NOT NULL DEFAULT '' CHECK (length(completion_receipt_id) <= 80),
  completion_receipt_url TEXT NOT NULL DEFAULT '' CHECK (length(completion_receipt_url) <= 300),
  UNIQUE (record_type, project, decision_revision),
  UNIQUE (source_request_id),
  CHECK (
    (status = 'queued' AND delivered_at IS NULL AND accepted_at IS NULL AND completed_at IS NULL) OR
    (status = 'delivered' AND delivered_at IS NOT NULL AND delivered_receipt_id <> '' AND delivered_receipt_url <> '' AND accepted_at IS NULL AND completed_at IS NULL) OR
    (status = 'accepted' AND delivered_at IS NOT NULL AND delivered_receipt_id <> '' AND delivered_receipt_url <> '' AND accepted_at IS NOT NULL AND accepted_by <> '' AND accepted_receipt_id <> '' AND accepted_receipt_url <> '' AND completed_at IS NULL) OR
    (status = 'completed' AND delivered_at IS NOT NULL AND delivered_receipt_id <> '' AND delivered_receipt_url <> '' AND accepted_at IS NOT NULL AND accepted_by <> '' AND accepted_receipt_id <> '' AND accepted_receipt_url <> '' AND completed_at IS NOT NULL AND completion_note <> '' AND completion_receipt_id <> '' AND completion_receipt_url <> '')
  )
) WITHOUT ROWID;

CREATE INDEX owner_lab_deliveries_status_time
  ON owner_lab_deliveries (status, queued_at, delivery_id);

CREATE INDEX owner_lab_deliveries_project_revision
  ON owner_lab_deliveries (project, decision_revision);

CREATE UNIQUE INDEX owner_lab_deliveries_unique_delivery_receipt
  ON owner_lab_deliveries (delivered_receipt_url)
  WHERE delivered_receipt_url <> '';

CREATE UNIQUE INDEX owner_lab_deliveries_unique_acceptance_receipt
  ON owner_lab_deliveries (accepted_receipt_url)
  WHERE accepted_receipt_url <> '';

CREATE UNIQUE INDEX owner_lab_deliveries_unique_completion_receipt
  ON owner_lab_deliveries (completion_receipt_url)
  WHERE completion_receipt_url <> '';

CREATE TRIGGER owner_lab_deliveries_immutable_snapshot
BEFORE UPDATE ON owner_lab_deliveries
WHEN OLD.delivery_id IS NOT NEW.delivery_id
  OR OLD.record_type IS NOT NEW.record_type
  OR OLD.project IS NOT NEW.project
  OR OLD.project_name IS NOT NEW.project_name
  OR OLD.decision_revision IS NOT NEW.decision_revision
  OR OLD.decision IS NOT NEW.decision
  OR OLD.note IS NOT NEW.note
  OR OLD.scope IS NOT NEW.scope
  OR OLD.source_revision IS NOT NEW.source_revision
  OR OLD.source_request_id IS NOT NEW.source_request_id
  OR OLD.destination_type IS NOT NEW.destination_type
  OR OLD.destination_ref IS NOT NEW.destination_ref
  OR OLD.queued_at IS NOT NEW.queued_at
BEGIN
  SELECT RAISE(ABORT, 'delivery snapshot is immutable');
END;

CREATE TRIGGER owner_lab_deliveries_ordered_status
BEFORE UPDATE OF status ON owner_lab_deliveries
WHEN NOT (
  (OLD.status = 'queued' AND NEW.status = 'delivered') OR
  (OLD.status = 'delivered' AND NEW.status = 'accepted') OR
  (OLD.status = 'accepted' AND NEW.status = 'completed') OR
  OLD.status = NEW.status
)
BEGIN
  SELECT RAISE(ABORT, 'delivery status transition is invalid');
END;

CREATE TRIGGER owner_lab_deliveries_no_delete
BEFORE DELETE ON owner_lab_deliveries
BEGIN
  SELECT RAISE(ABORT, 'delivery records are immutable');
END;
