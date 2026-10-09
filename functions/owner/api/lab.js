import { requireOwner, sameOriginApiRequest, unavailable } from "../../_shared/access.js";

const MAX_BODY_BYTES = 1024;
const MAX_PROJECTS = 40;
const DECISIONS = new Set(["approved", "changes_requested", "parked"]);
const STATES = new Set(["review", "testing", "published", "status_check", "ideas"]);
const PROJECTS_SQL = "SELECT project,sort_order,name,kind,state,state_label,summary,latest_result,lead,blocker,evidence,evidence_verified_at,preview_url,source_url,work_chat_url,source_revision,decision_question,recommendation,scope,review_prompt,feedback_prompts_json,review_checklist_json,updated_at FROM owner_lab_projects ORDER BY sort_order,project LIMIT 40";
const DECISIONS_SQL = "SELECT project,revision,decision,note,saved_at,request_id,queued_delivery_id FROM owner_lab_decisions ORDER BY project LIMIT 40";
const PROJECT_SQL = "SELECT project,sort_order,name,kind,state,state_label,summary,latest_result,lead,blocker,evidence,evidence_verified_at,preview_url,source_url,work_chat_url,source_revision,decision_question,recommendation,scope,review_prompt,feedback_prompts_json,review_checklist_json,updated_at FROM owner_lab_projects WHERE project=? LIMIT 1";
const DECISION_SQL = "SELECT project,revision,decision,note,saved_at,request_id,queued_delivery_id FROM owner_lab_decisions WHERE project=? LIMIT 1";
const DELIVERY_FIELDS = "delivery_id,record_type,project,project_name,decision_revision,decision,note,scope,source_revision,source_request_id,destination_type,destination_ref,status,queued_at,delivered_at,delivered_receipt_id,delivered_receipt_url,accepted_at,accepted_by,accepted_note,accepted_receipt_id,accepted_receipt_url,completed_at,completion_note,completion_receipt_id,completion_receipt_url";
const CURRENT_DELIVERY_FIELDS = DELIVERY_FIELDS.split(",").map(field => `l.${field}`).join(",");
const DELIVERIES_SQL = `SELECT ${CURRENT_DELIVERY_FIELDS} FROM owner_lab_deliveries l JOIN owner_lab_decisions d ON d.project=l.project AND d.revision=l.decision_revision WHERE l.record_type='owner_decision' ORDER BY l.queued_at,l.delivery_id LIMIT 40`;
const DELIVERY_BY_SOURCE_SQL = `SELECT ${DELIVERY_FIELDS} FROM owner_lab_deliveries WHERE source_request_id=? LIMIT 1`;
const DELIVERY_BY_REVISION_SQL = `SELECT ${DELIVERY_FIELDS} FROM owner_lab_deliveries WHERE record_type='owner_decision' AND project=? AND decision_revision=? LIMIT 1`;
const INSERT_SQL = "INSERT INTO owner_lab_decisions(project,revision,decision,note,saved_at,request_id,queued_delivery_id) VALUES(?,1,?,?,?,?,?) ON CONFLICT(project) DO NOTHING RETURNING project,revision,decision,note,saved_at,request_id,queued_delivery_id";
const UPDATE_SQL = "UPDATE owner_lab_decisions SET revision=revision+1,decision=?,note=?,saved_at=?,request_id=?,queued_delivery_id=? WHERE project=? AND revision=? RETURNING project,revision,decision,note,saved_at,request_id,queued_delivery_id";
const ENQUEUE_SQL = `INSERT INTO owner_lab_deliveries(delivery_id,record_type,project,project_name,decision_revision,decision,note,scope,source_revision,source_request_id,destination_type,destination_ref,status,queued_at) SELECT ?,'owner_decision',d.project,p.name,d.revision,d.decision,d.note,COALESCE(NULLIF(p.scope,''),'No project work is authorized beyond this saved decision.'),p.source_revision,d.request_id,p.delivery_destination_type,p.delivery_destination_ref,'queued',d.saved_at FROM owner_lab_decisions d JOIN owner_lab_projects p ON p.project=d.project WHERE d.project=? AND d.request_id=? AND d.queued_delivery_id=? ON CONFLICT DO NOTHING RETURNING ${DELIVERY_FIELDS}`;

function json(status, value) {
  return new Response(JSON.stringify(value), { status, headers: {
    "cache-control": "private, no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer",
    "vary": "Authorization",
    "x-content-type-options": "nosniff",
  }});
}

function enabled(env) {
  return env.ANALYTICS_DASHBOARD_ENABLED === "true"
    && env.ANALYTICS_QUERY_CONTEXT === "test"
    && Boolean(env.TRIKZIK_DB?.prepare);
}

function text(value, max) {
  return String(value || "").slice(0, max);
}

function stringList(value, maxItems, maxLength) {
  let parsed;
  try { parsed = JSON.parse(String(value || "[]")); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed.slice(0, maxItems).flatMap(item => typeof item === "string" && item.trim() ? [item.trim().slice(0, maxLength)] : []);
}

function safeUrl(value, previewOnly = false) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    const previewHosts = url.hostname === "trikzik.com" || url.hostname === "www.trikzik.com" || url.hostname.endsWith(".ernest-turner.pages.dev") || url.hostname === "printquote-pocket.trikzik13.chatgpt.site";
    const sourceHosts = previewHosts || url.hostname === "github.com" || url.hostname === "trikziklabs.slack.com";
    return url.protocol === "https:" && (previewOnly ? previewHosts : sourceHosts) ? url.href : "";
  } catch { return ""; }
}

function cleanProject(row) {
  if (!row || typeof row.project !== "string" || !/^[a-z0-9_]{2,48}$/.test(row.project) || !STATES.has(row.state)) return null;
  const updatedAt = Number(row.updated_at);
  return {
    id: row.project,
    order: Number.isSafeInteger(Number(row.sort_order)) ? Number(row.sort_order) : 1000,
    name: text(row.name, 80),
    kind: text(row.kind, 40),
    state: row.state,
    stateLabel: text(row.state_label, 80),
    summary: text(row.summary, 500),
    latestResult: text(row.latest_result, 500),
    lead: text(row.lead, 100),
    blocker: text(row.blocker, 400),
    evidence: text(row.evidence, 200),
    evidenceVerifiedAt: text(row.evidence_verified_at, 32),
    previewUrl: safeUrl(row.preview_url, true),
    sourceUrl: safeUrl(row.source_url),
    workChatUrl: safeUrl(row.work_chat_url),
    sourceRevision: text(row.source_revision, 64),
    decisionQuestion: text(row.decision_question, 400),
    recommendation: text(row.recommendation, 400),
    scope: text(row.scope, 300),
    reviewPrompt: text(row.review_prompt, 500),
    feedbackPrompts: stringList(row.feedback_prompts_json, 6, 180),
    reviewChecklist: stringList(row.review_checklist_json, 8, 240),
    updatedAt: Number.isSafeInteger(updatedAt) && updatedAt > 0 ? new Date(updatedAt * 1000).toISOString() : null,
  };
}

function cleanDelivery(row) {
  if (!row || typeof row.delivery_id !== "string" || !/^[0-9a-f-]{36}$/i.test(row.delivery_id)) return null;
  const queuedAt = Number(row.queued_at), deliveredAt = Number(row.delivered_at), acceptedAt = Number(row.accepted_at), completedAt = Number(row.completed_at);
  const status = ["queued", "delivered", "accepted", "completed"].includes(row.status) ? row.status : "queued";
  return {
    id: row.delivery_id,
    status,
    recordType: row.record_type === "synthetic_test" ? "synthetic_test" : "owner_decision",
    destinationType: row.destination_type === "slack_thread" ? "slack_thread" : "unassigned",
    destinationRef: safeUrl(row.destination_ref),
    scope: text(row.scope, 300),
    sourceRevision: text(row.source_revision, 64),
    queuedAt: Number.isSafeInteger(queuedAt) && queuedAt > 0 ? new Date(queuedAt * 1000).toISOString() : null,
    deliveredAt: Number.isSafeInteger(deliveredAt) && deliveredAt > 0 ? new Date(deliveredAt * 1000).toISOString() : null,
    deliveredReceiptUrl: safeUrl(row.delivered_receipt_url),
    acceptedAt: Number.isSafeInteger(acceptedAt) && acceptedAt > 0 ? new Date(acceptedAt * 1000).toISOString() : null,
    acceptedBy: text(row.accepted_by, 100),
    acceptedNote: text(row.accepted_note, 400),
    acceptedReceiptUrl: safeUrl(row.accepted_receipt_url),
    completedAt: Number.isSafeInteger(completedAt) && completedAt > 0 ? new Date(completedAt * 1000).toISOString() : null,
    completionNote: text(row.completion_note, 500),
    completionReceiptUrl: safeUrl(row.completion_receipt_url),
  };
}

function cleanDecision(row, deliveryRow) {
  if (!row || typeof row.project !== "string") return null;
  const revision = Number(row.revision), savedAt = Number(row.saved_at);
  if (!Number.isSafeInteger(revision) || revision < 1 || !DECISIONS.has(row.decision)) return null;
  const delivery = cleanDelivery(deliveryRow);
  return {
    revision,
    decision: row.decision,
    note: text(row.note, 400),
    savedAt: Number.isSafeInteger(savedAt) && savedAt > 0 ? new Date(savedAt * 1000).toISOString() : null,
    requestId: text(row.request_id, 36),
    savedState: "saved",
    delivery,
    deliveryState: delivery?.status === "queued" ? "queued" : delivery ? "delivered" : "not_queued",
    acceptanceState: ["accepted", "completed"].includes(delivery?.status) ? "accepted" : "not_accepted",
    completionState: delivery?.status === "completed" ? "completed" : "not_started",
  };
}

function pendingWorkflow() {
  return { revision: 0, decision: "pending", note: "", savedAt: null, requestId: null, savedState: "not_saved", delivery: null, deliveryState: "not_queued", acceptanceState: "not_accepted", completionState: "not_started" };
}

const DELIVERY = Object.freeze({
  automatic: false,
  operatorAvailable: true,
  label: "Agent pickup required",
  explanation: "Saving queues a bounded request for an authorized agent to pick up. It does not automatically message or wake Pip, Rivet, Slack, or any agent. Delivery, acceptance, and completion appear only after verified receipts are recorded.",
});

function entry(project, decision, delivery) {
  return { project, workflow: cleanDecision(decision, delivery) || pendingWorkflow() };
}

async function authenticate(request, env) {
  if (!enabled(env)) return { ok: false, response: unavailable() };
  if (!sameOriginApiRequest(request, env)) return { ok: false, response: json(403, { error: "Request rejected" }) };
  return requireOwner(request, env);
}

async function projectRow(env, project) {
  return env.TRIKZIK_DB.prepare(PROJECT_SQL).bind(project).first();
}

async function decisionRow(env, project) {
  return env.TRIKZIK_DB.prepare(DECISION_SQL).bind(project).first();
}

async function deliveryBySource(env, requestId) {
  return requestId ? env.TRIKZIK_DB.prepare(DELIVERY_BY_SOURCE_SQL).bind(requestId).first() : null;
}

async function deliveryByRevision(env, project, revision) {
  return env.TRIKZIK_DB.prepare(DELIVERY_BY_REVISION_SQL).bind(project, revision).first();
}

export async function onRequestGet({ request, env }) {
  const access = await authenticate(request, env);
  if (!access.ok) return access.response;
  try {
    const projectStatement = env.TRIKZIK_DB.prepare(PROJECTS_SQL);
    const decisionStatement = env.TRIKZIK_DB.prepare(DECISIONS_SQL), deliveryStatement = env.TRIKZIK_DB.prepare(DELIVERIES_SQL);
    let projectResult, decisionResult, deliveryResult;
    if (typeof env.TRIKZIK_DB.batch === "function") [projectResult, decisionResult, deliveryResult] = await env.TRIKZIK_DB.batch([projectStatement, decisionStatement, deliveryStatement]);
    else [projectResult, decisionResult, deliveryResult] = await Promise.all([projectStatement.all(), decisionStatement.all(), deliveryStatement.all()]);
    const projects = (projectResult?.results || []).slice(0, MAX_PROJECTS).map(cleanProject).filter(Boolean);
    if (!projects.length) return json(503, { error: "My Lab catalog is unavailable" });
    const decisions = new Map((decisionResult?.results || []).map(row => [row.project, row]));
    const deliveries = new Map((deliveryResult?.results || []).map(row => [`${row.project}:${row.decision_revision}`, row]));
    return json(200, { context: "test", projects: projects.map(project => { const decision = decisions.get(project.id); return entry(project, decision, decision ? deliveries.get(`${project.id}:${decision.revision}`) : null); }), delivery: DELIVERY, generatedAt: new Date().toISOString() });
  } catch {
    return json(503, { error: "My Lab is unavailable" });
  }
}

function validBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (Object.keys(value).sort().join() !== "decision,expectedRevision,note,project,requestId") return null;
  if (typeof value.project !== "string" || !/^[a-z0-9_]{2,48}$/.test(value.project) || !DECISIONS.has(value.decision)) return null;
  if (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0 || value.expectedRevision > 1000000) return null;
  if (typeof value.note !== "string" || value.note.length > 400 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.note)) return null;
  if (typeof value.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)) return null;
  return { ...value, note: value.note.trim() };
}

export async function onRequestPost({ request, env }) {
  const access = await authenticate(request, env);
  if (!access.ok) return access.response;
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") return json(415, { error: "Request rejected" });
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return json(413, { error: "Request rejected" });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json(413, { error: "Request rejected" });
  let value;
  try { value = JSON.parse(raw); } catch { return json(400, { error: "Request rejected" }); }
  const body = validBody(value);
  if (!body) return json(400, { error: "Request rejected" });

  try {
    const project = cleanProject(await projectRow(env, body.project));
    if (!project || (!project.decisionQuestion && body.expectedRevision === 0)) return json(400, { error: "No owner decision is requested for this project" });
    if (typeof env.TRIKZIK_DB.batch !== "function") return json(503, { error: "My Lab save is unavailable" });
    const now = Math.floor(Date.now() / 1000), deliveryId = crypto.randomUUID();
    const statement = body.expectedRevision === 0
      ? env.TRIKZIK_DB.prepare(INSERT_SQL).bind(body.project, body.decision, body.note, now, body.requestId, deliveryId)
      : env.TRIKZIK_DB.prepare(UPDATE_SQL).bind(body.decision, body.note, now, body.requestId, deliveryId, body.project, body.expectedRevision);
    const enqueue = env.TRIKZIK_DB.prepare(ENQUEUE_SQL).bind(deliveryId, body.project, body.requestId, deliveryId);
    const [savedResult, deliveryResult] = await env.TRIKZIK_DB.batch([statement, enqueue]);
    const saved = savedResult?.results?.[0] || null, queued = deliveryResult?.results?.[0] || null;
    if (saved && queued) return json(200, { context: "test", entry: entry(project, saved, queued), delivery: DELIVERY, repeated: false });
    if (saved && !queued) return json(503, { error: "My Lab save is unavailable" });

    const current = await decisionRow(env, body.project);
    if (current && current.request_id === body.requestId && current.decision === body.decision && current.note === body.note) {
      const existingDelivery = await deliveryBySource(env, current.request_id);
      return json(200, { context: "test", entry: entry(project, current, existingDelivery), delivery: DELIVERY, repeated: true });
    }
    const currentDelivery = current ? await deliveryByRevision(env, body.project, current.revision) : null;
    return json(409, { context: "test", entry: entry(project, current, currentDelivery), delivery: DELIVERY, error: "A newer decision is already saved" });
  } catch {
    return json(503, { error: "My Lab save is unavailable" });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
