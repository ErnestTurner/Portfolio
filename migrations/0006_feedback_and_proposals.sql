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

ALTER TABLE owner_lab_projects ADD COLUMN proposal_version INTEGER NOT NULL DEFAULT 1 CHECK(proposal_version BETWEEN 1 AND 1000000);
ALTER TABLE owner_lab_projects ADD COLUMN proposal_action TEXT NOT NULL DEFAULT 'Review direction' CHECK(length(proposal_action) BETWEEN 1 AND 160);
ALTER TABLE owner_lab_projects ADD COLUMN proposal_target_environment TEXT NOT NULL DEFAULT 'none' CHECK(proposal_target_environment IN ('none','test','preview','production'));
ALTER TABLE owner_lab_projects ADD COLUMN proposal_text TEXT NOT NULL DEFAULT '' CHECK(length(proposal_text)<=1000);
ALTER TABLE owner_lab_projects ADD COLUMN proposal_exclusions_json TEXT NOT NULL DEFAULT '[]' CHECK(length(proposal_exclusions_json)<=1500);

UPDATE owner_lab_projects SET
  proposal_action=CASE WHEN state='testing' THEN 'Continue bounded testing' WHEN state='review' THEN 'Review and record direction' ELSE 'Record owner direction' END,
  proposal_target_environment=CASE WHEN state='testing' THEN 'preview' ELSE 'none' END,
  proposal_text=decision_question,
  proposal_exclusions_json='["Automatic execution","Unscoped follow-on work","Access, billing, or credential changes"]'
WHERE decision_question<>'';

UPDATE owner_lab_projects SET
  proposal_version=2,
  proposal_action='Publish the prepared Scribble-only release',
  proposal_target_environment='production',
  proposal_text='Push the eight prepared Scribble commits ending at 4195d7a to production main and deploy the existing curated Cloudflare Pages artifact. Keep My Lab, authentication, and production data unchanged.',
  proposal_exclusions_json='["My Lab or authentication changes","Database changes","Feedback collector changes","Unrelated preview work"]',
  source_revision='4195d7a3faad92b90cbb541d0a917506bf34950b',
  scope='Scribble page and dedicated test only. No automatic execution or unrelated production changes.',
  updated_at=unixepoch()
WHERE project='scribble';

INSERT INTO owner_lab_projects(project,sort_order,name,kind,state,state_label,summary,latest_result,lead,blocker,evidence,evidence_verified_at,preview_url,source_url,work_chat_url,source_revision,decision_question,recommendation,scope,review_prompt,feedback_prompts_json,review_checklist_json,proposal_version,proposal_action,proposal_target_environment,proposal_text,proposal_exclusions_json,updated_at)
VALUES('coworker_feedback',25,'Coworker Feedback','Private preview','review','Preview review','A simple private feedback form with one open prompt and optional practical details.','Preview implementation stores bounded anonymous notes separately and exposes them only through the exact owner gate.','Pip coordinates','Retention must be decided before any production launch.','Preview implementation and tests','','https://preview-interactive-playgrou-3474.ernest-turner.pages.dev/feedback.html','https://github.com/ErnestTurner/Portfolio','','','Is this feedback workflow ready for a bounded production proposal after retention is decided?','Review the phone form, submit only synthetic text, then confirm it appears in the private Feedback tab.','Preview feedback only. No production collector, outreach, email, Slack, file upload, or automatic execution.','Does the form feel simple while still allowing useful bug details?','["Is the main prompt enough for a casual note?","Are optional details unobtrusive?","Is the privacy warning clear?"]','["Open the form on phone.","Submit one synthetic note.","Confirm server receipt before success.","Verify the private owner-only read view."]',1,'Review the bounded feedback preview','preview','Review the private preview form, its bounded collector, and owner-only read view before deciding whether to prepare a production launch.','["Production collection","Coworker outreach","New services or credentials","Automatic forwarding or deletion"]',unixepoch())
ON CONFLICT(project) DO UPDATE SET state=excluded.state,state_label=excluded.state_label,summary=excluded.summary,latest_result=excluded.latest_result,lead=excluded.lead,blocker=excluded.blocker,evidence=excluded.evidence,preview_url=excluded.preview_url,source_url=excluded.source_url,decision_question=excluded.decision_question,recommendation=excluded.recommendation,scope=excluded.scope,review_prompt=excluded.review_prompt,feedback_prompts_json=excluded.feedback_prompts_json,review_checklist_json=excluded.review_checklist_json,proposal_version=owner_lab_projects.proposal_version+1,proposal_action=excluded.proposal_action,proposal_target_environment=excluded.proposal_target_environment,proposal_text=excluded.proposal_text,proposal_exclusions_json=excluded.proposal_exclusions_json,updated_at=excluded.updated_at;

ALTER TABLE owner_lab_decisions ADD COLUMN proposal_version INTEGER DEFAULT NULL CHECK(proposal_version IS NULL OR proposal_version BETWEEN 1 AND 1000000);
ALTER TABLE owner_lab_decisions ADD COLUMN proposal_snapshot_json TEXT NOT NULL DEFAULT '' CHECK(length(proposal_snapshot_json)<=3000);
ALTER TABLE owner_lab_deliveries ADD COLUMN proposal_version INTEGER DEFAULT NULL CHECK(proposal_version IS NULL OR proposal_version BETWEEN 1 AND 1000000);
ALTER TABLE owner_lab_deliveries ADD COLUMN proposal_snapshot_json TEXT NOT NULL DEFAULT '' CHECK(length(proposal_snapshot_json)<=3000);

CREATE TRIGGER owner_lab_delivery_proposal_snapshot_immutable
BEFORE UPDATE ON owner_lab_deliveries
WHEN OLD.proposal_version IS NOT NEW.proposal_version OR OLD.proposal_snapshot_json IS NOT NEW.proposal_snapshot_json
BEGIN SELECT RAISE(ABORT,'delivery proposal snapshot is immutable'); END;
