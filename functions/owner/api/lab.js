import { requireOwner, sameOriginApiRequest, unavailable } from "../../_shared/access.js";

const MAX_BODY_BYTES = 1024;
const PROJECT_ID = "scribble";
const DECISIONS = new Set(["approved", "changes_requested", "parked"]);
const PROJECT = Object.freeze({
  id: PROJECT_ID,
  name: "Scribble Engine",
  previewUrl: "https://776aab5c.ernest-turner.pages.dev/games/scribble-engine/",
  commit: "3c311b019103430facb3972993386e6c51869580",
  sourceRevision: "3c311b0",
  evidenceVerifiedAt: "2026-10-08T22:42:01.000Z",
  buildStatus: "Preview complete; owner review pending",
  latestResult: "Separate Draw, Recipe, and Replay workspaces are deployed and verified on desktop and phone.",
  testResult: "29 automated tests passed",
  lead: "No dashboard-linked agent run",
  blocker: "Owner review is pending. Dashboard-to-agent delivery is not connected.",
  scope: "Review this preview only. No production release or automatic execution is attached.",
  decisionQuestion: "Are the separate Draw, Recipe, and Replay workspaces clear enough to continue toward production review?",
  recommendation: "Try the preview on your phone, switch modes mid-run, and approve only if each mode returns paused at the same point.",
  reviewPrompt: "Make the strangest drawing you can. Then change just one setting and see whether you can make it stranger. Which version would you keep?",
  feedbackPrompts: ["What surprised you?", "What did you want instead?", "What one thing should we try next?"],
  reviewChecklist: [
    "Change Draw speed, switch to Recipe, return, then explicitly resume.",
    "Switch between Recipe and Replay mid-run and confirm neither advances while hidden.",
    "Finish a Recipe, use its Share and Replay actions, and check the target is correct.",
    "Cancel a fresh Recipe or Replay start and confirm the existing drawing remains intact.",
  ],
});

const SELECT_SQL = "SELECT project,revision,decision,note,saved_at,request_id FROM owner_lab_decisions WHERE project=? LIMIT 1";
const INSERT_SQL = "INSERT INTO owner_lab_decisions(project,revision,decision,note,saved_at,request_id) VALUES(?,1,?,?,?,?) ON CONFLICT(project) DO NOTHING RETURNING project,revision,decision,note,saved_at,request_id";
const UPDATE_SQL = "UPDATE owner_lab_decisions SET revision=revision+1,decision=?,note=?,saved_at=?,request_id=? WHERE project=? AND revision=? RETURNING project,revision,decision,note,saved_at,request_id";

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: {
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

function cleanRow(row) {
  if (!row || row.project !== PROJECT_ID) return null;
  const revision = Number(row.revision);
  const savedAt = Number(row.saved_at);
  if (!Number.isSafeInteger(revision) || revision < 1 || !DECISIONS.has(row.decision)) return null;
  return {
    revision,
    decision: row.decision,
    note: String(row.note || "").slice(0, 400),
    savedAt: Number.isSafeInteger(savedAt) && savedAt > 0 ? new Date(savedAt * 1000).toISOString() : null,
    requestId: String(row.request_id || "").slice(0, 36),
    savedState: "saved",
    deliveryState: "not_delivered",
    acceptanceState: "not_accepted",
    completionState: "not_started",
  };
}

function pendingWorkflow() {
  return {
    revision: 0,
    decision: "pending",
    note: "",
    savedAt: null,
    requestId: null,
    savedState: "not_saved",
    deliveryState: "not_delivered",
    acceptanceState: "not_accepted",
    completionState: "not_started",
  };
}

function payload(row, extra = {}) {
  return {
    context: "test",
    project: PROJECT,
    workflow: cleanRow(row) || pendingWorkflow(),
    delivery: {
      connected: false,
      label: "Waiting for delivery",
      explanation: "A saved decision stays in My Lab. No supported dashboard route currently delivers it to Pip, Rivet, Slack, or an agent run.",
    },
    ...extra,
  };
}

async function authenticate(request, env) {
  if (!enabled(env)) return { ok: false, response: unavailable() };
  if (!sameOriginApiRequest(request, env)) return { ok: false, response: json(403, { error: "Request rejected" }) };
  return requireOwner(request, env);
}

async function currentRow(env) {
  return env.TRIKZIK_DB.prepare(SELECT_SQL).bind(PROJECT_ID).first();
}

export async function onRequestGet({ request, env }) {
  const access = await authenticate(request, env);
  if (!access.ok) return access.response;
  try {
    return json(200, payload(await currentRow(env)));
  } catch {
    return json(503, { error: "My Lab is unavailable" });
  }
}

function validBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = Object.keys(value).sort();
  if (keys.join() !== "decision,expectedRevision,note,project,requestId") return null;
  if (value.project !== PROJECT_ID || !DECISIONS.has(value.decision)) return null;
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
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return json(413, { error: "Request rejected" });
  let value;
  try { value = JSON.parse(text); } catch { return json(400, { error: "Request rejected" }); }
  const body = validBody(value);
  if (!body) return json(400, { error: "Request rejected" });

  const now = Math.floor(Date.now() / 1000);
  try {
    const statement = body.expectedRevision === 0
      ? env.TRIKZIK_DB.prepare(INSERT_SQL).bind(PROJECT_ID, body.decision, body.note, now, body.requestId)
      : env.TRIKZIK_DB.prepare(UPDATE_SQL).bind(body.decision, body.note, now, body.requestId, PROJECT_ID, body.expectedRevision);
    const saved = await statement.first();
    if (saved) return json(200, payload(saved, { repeated: false }));

    const current = await currentRow(env);
    if (current && current.request_id === body.requestId && current.decision === body.decision && current.note === body.note) {
      return json(200, payload(current, { repeated: true }));
    }
    return json(409, payload(current, { error: "A newer decision is already saved" }));
  } catch {
    return json(503, { error: "My Lab save is unavailable" });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
