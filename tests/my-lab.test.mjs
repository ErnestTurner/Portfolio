import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });
const { onRequestGet: readLab, onRequestPost: saveLab } = await import("../functions/owner/api/lab.js");
const { onRequestGet: dashboard } = await import("../functions/owner/analytics.js");

const now = Math.floor(Date.now() / 1000);
function project(project, overrides = {}) {
  return {
    project, sort_order: 1, name: project.replaceAll("_", " "), kind: "Project", state: "review", state_label: "Ready for review",
    summary: "Verified project summary.", latest_result: "Verified latest result.", lead: "Pip - coordination", blocker: "Owner review pending.",
    evidence: "Verified source record.", evidence_verified_at: "2026-10-09T15:58:00.000Z", preview_url: "https://preview.example.ernest-turner.pages.dev/",
    source_url: "https://github.com/ErnestTurner/Portfolio", work_chat_url: "https://trikziklabs.slack.com/archives/TEST/p123",
    source_revision: "abc1234", decision_question: "Is this direction ready to continue?", recommendation: "Review the current evidence.", scope: "Preview only.",
    review_prompt: "Try the current workflow.", feedback_prompts_json: '["What surprised you?"]', review_checklist_json: '["Check it on phone."]', updated_at: now,
    ...overrides,
  };
}

function decision(projectId, revision, value, note, requestId) {
  return { project: projectId, revision, decision: value, note, saved_at: now, request_id: requestId };
}

function labDb({ projects = [], decisions = [] } = {}) {
  let decisionRows = decisions.map(row => ({ ...row }));
  const calls = [];
  return {
    calls,
    get decisions() { return decisionRows.map(row => ({ ...row })); },
    prepare(sql) {
      const call = { sql, args: [] };
      calls.push(call);
      const statement = {
        bind(...args) { call.args = args; return statement; },
        async all() {
          if (sql.includes("FROM owner_lab_projects")) return { results: projects.map(row => ({ ...row })) };
          if (sql.includes("FROM owner_lab_decisions")) return { results: decisionRows.map(row => ({ ...row })) };
          throw new Error("Unexpected all SQL");
        },
        async first() {
          if (sql.includes("FROM owner_lab_projects") && sql.includes("WHERE project=?")) return projects.find(row => row.project === call.args[0]) || null;
          if (sql.startsWith("SELECT") && sql.includes("FROM owner_lab_decisions")) return decisionRows.find(row => row.project === call.args[0]) || null;
          if (sql.startsWith("INSERT")) {
            if (decisionRows.some(row => row.project === call.args[0])) return null;
            const row = decision(call.args[0], 1, call.args[1], call.args[2], call.args[4]); row.saved_at = call.args[3]; decisionRows.push(row); return { ...row };
          }
          if (sql.startsWith("UPDATE")) {
            const index = decisionRows.findIndex(row => row.project === call.args[4] && row.revision === call.args[5]);
            if (index < 0) return null;
            const row = decision(call.args[4], decisionRows[index].revision + 1, call.args[0], call.args[1], call.args[3]); row.saved_at = call.args[2]; decisionRows[index] = row; return { ...row };
          }
          throw new Error("Unexpected first SQL");
        },
      };
      return statement;
    },
    async batch(statements) { return Promise.all(statements.map(statement => statement.all())); },
  };
}

function b64(value) { return Buffer.from(value).toString("base64url"); }
async function tokenFixture() {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]), jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  Object.assign(jwk, { kid: "multi-lab-test-key", alg: "RS256", use: "sig" });
  async function token(overrides = {}) { const header = b64(JSON.stringify({ alg: "RS256", kid: jwk.kid, typ: "JWT" })), claims = b64(JSON.stringify({ aud: "trikzik-owner-auth", iss: "https://securetoken.google.com/trikzik-owner-auth", sub: "owner-uid-123", user_id: "owner-uid-123", email: "owner@example.test", email_verified: true, iat: now - 10, auth_time: now - 20, exp: now + 300, ...overrides })), signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${header}.${claims}`)); return `${header}.${claims}.${b64(signature)}`; }
  return { token, fetch: async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }) };
}
const fixturePromise = tokenFixture(), requestIdA = "11111111-1111-4111-8111-111111111111", requestIdB = "22222222-2222-4222-8222-222222222222", requestIdC = "33333333-3333-4333-8333-333333333333";
function env(db) { return { ANALYTICS_DASHBOARD_ENABLED: "true", ANALYTICS_OWNER_HOSTS: "preview.example", ANALYTICS_QUERY_CONTEXT: "test", FIREBASE_PROJECT_ID: "trikzik-owner-auth", FIREBASE_OWNER_EMAIL: "owner@example.test", FIREBASE_OWNER_UID: "owner-uid-123", TRIKZIK_DB: db }; }
async function ownerHeaders(overrides = {}) { const fixture = await fixturePromise; return { authorization: `Bearer ${await fixture.token(overrides)}`, origin: "https://preview.example", "sec-fetch-site": "same-origin" }; }
function getRequest(headers) { return new Request("https://preview.example/owner/api/lab", { headers }); }
function postRequest(body, headers, contentType = "application/json") { return new Request("https://preview.example/owner/api/lab", { method: "POST", headers: { ...headers, "content-type": contentType }, body: typeof body === "string" ? body : JSON.stringify(body) }); }

test("multi-project My Lab fails closed for signed-out, wrong-owner, cross-site, production, and unbound requests", async () => {
  const fixture = await fixturePromise, db = labDb({ projects: [project("scribble")] }), base = env(db), original = globalThis.fetch; globalThis.fetch = fixture.fetch;
  try {
    assert.equal((await readLab({ request: getRequest({ origin: "https://preview.example", "sec-fetch-site": "same-origin" }), env: base })).status, 401);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders({ email: "wrong@example.test" })), env: base })).status, 401);
    assert.equal((await readLab({ request: getRequest({ ...(await ownerHeaders()), "sec-fetch-site": "cross-site" }), env: base })).status, 403);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders()), env: { ...base, ANALYTICS_QUERY_CONTEXT: "production" } })).status, 404);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders()), env: { ...base, TRIKZIK_DB: null } })).status, 404);
    assert.equal(db.calls.length, 0);
  } finally { globalThis.fetch = original; }
});

test("catalog returns bounded owner-only projects with isolated saved workflows and safe links", async () => {
  const fixture = await fixturePromise, projects = [project("scribble"), project("pocket_mote", { sort_order: 2 }), project("historical", { sort_order: 3, state: "status_check", state_label: "Needs a status check", decision_question: "", preview_url: "https://evil.example/", source_url: "https://evil.example/private", work_chat_url: "" })], decisions = [decision("scribble", 3, "approved", "Keep testing.", requestIdA)], db = labDb({ projects, decisions }), original = globalThis.fetch; globalThis.fetch = fixture.fetch;
  try {
    const response = await readLab({ request: getRequest(await ownerHeaders()), env: env(db) }); assert.equal(response.status, 200); const data = await response.json();
    assert.equal(data.projects.length, 3); assert.deepEqual(data.projects.map(entry => entry.project.id), ["scribble", "pocket_mote", "historical"]);
    assert.equal(data.projects[0].workflow.revision, 3); assert.equal(data.projects[1].workflow.decision, "pending"); assert.equal(data.projects[2].project.previewUrl, ""); assert.equal(data.projects[2].project.sourceUrl, "");
    assert.equal(data.delivery.connected, false); assert.match(data.delivery.explanation, /No supported dashboard route/); assert.equal(response.headers.get("cache-control"), "private, no-store");
  } finally { globalThis.fetch = original; }
});

test("decisions remain isolated by project across save, retry, reload, update, and stale conflict", async () => {
  const fixture = await fixturePromise, projects = [project("scribble"), project("pocket_mote", { sort_order: 2 }), project("published_toy", { sort_order: 3, state: "published", state_label: "Published", decision_question: "" })], db = labDb({ projects }), headers = await ownerHeaders(), original = globalThis.fetch; globalThis.fetch = fixture.fetch;
  const scribble = { project: "scribble", decision: "approved", note: "Keep testing.", expectedRevision: 0, requestId: requestIdA }, pocket = { project: "pocket_mote", decision: "changes_requested", note: "Inspect the repair.", expectedRevision: 0, requestId: requestIdB };
  try {
    assert.equal((await saveLab({ request: postRequest(scribble, headers), env: env(db) })).status, 200); assert.equal((await saveLab({ request: postRequest(pocket, headers), env: env(db) })).status, 200);
    const retry = await saveLab({ request: postRequest(pocket, headers), env: env(db) }); assert.equal(retry.status, 200); assert.equal((await retry.json()).repeated, true); assert.equal(db.decisions.length, 2);
    const reload = await readLab({ request: getRequest(headers), env: env(db) }), entries = new Map((await reload.json()).projects.map(entry => [entry.project.id, entry.workflow])); assert.equal(entries.get("scribble").note, "Keep testing."); assert.equal(entries.get("pocket_mote").note, "Inspect the repair.");
    const stale = await saveLab({ request: postRequest({ ...scribble, decision: "parked", note: "Later", requestId: requestIdC }, headers), env: env(db) }); assert.equal(stale.status, 409); assert.equal((await stale.json()).entry.workflow.decision, "approved"); assert.equal(db.decisions.find(row => row.project === "pocket_mote").decision, "changes_requested");
    const update = await saveLab({ request: postRequest({ ...pocket, decision: "parked", expectedRevision: 1, requestId: requestIdC }, headers), env: env(db) }); assert.equal(update.status, 200); assert.equal((await update.json()).entry.workflow.revision, 2); assert.equal(db.decisions.find(row => row.project === "scribble").revision, 1);
    assert.equal((await saveLab({ request: postRequest({ ...scribble, project: "unknown" }, headers), env: env(db) })).status, 400);
    assert.equal((await saveLab({ request: postRequest({ ...scribble, project: "published_toy", requestId: requestIdC }, headers), env: env(db) })).status, 400);
  } finally { globalThis.fetch = original; }
});

test("decision writes require exact bounded JSON and cannot claim delivery", async () => {
  const fixture = await fixturePromise, headers = await ownerHeaders(), original = globalThis.fetch, valid = { project: "scribble", decision: "approved", note: "", expectedRevision: 0, requestId: requestIdA }; globalThis.fetch = fixture.fetch;
  try {
    for (const [body, type, status] of [[valid, "text/plain", 415], [{ ...valid, decision: "delivered" }, "application/json", 400], [{ ...valid, delivered: true }, "application/json", 400], [{ ...valid, note: "x".repeat(401) }, "application/json", 400], [{ ...valid, requestId: "bad" }, "application/json", 400], ["x".repeat(1100), "application/json", 413]]) assert.equal((await saveLab({ request: postRequest(body, headers, type), env: env(labDb({ projects: [project("scribble")] })) })).status, status);
  } finally { globalThis.fetch = original; }
});

test("migration adds a private catalog and expands decisions while preserving prior records", async () => {
  const sql = await readFile(new URL("../migrations/0003_my_lab_projects.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS owner_lab_projects/); assert.match(sql, /owner_lab_projects_state_order/); assert.match(sql, /owner_lab_decisions_next/); assert.match(sql, /SELECT project,revision,decision,note,saved_at,request_id FROM owner_lab_decisions/); assert.match(sql, /ALTER TABLE owner_lab_decisions_next RENAME TO owner_lab_decisions/); assert.match(sql, /length\(note\) <= 400/); assert.doesNotMatch(sql, /Scribble Engine|Pocket Mote|Slack|github\.com/i);
});

test("dashboard provides attention-first filtering and per-project stale/retry guards without embedding catalog facts", async () => {
  const pageEnv = { ANALYTICS_DASHBOARD_ENABLED: "true", ANALYTICS_OWNER_HOSTS: "preview.example", FIREBASE_PROJECT_ID: "trikzik-owner-auth", FIREBASE_AUTH_DOMAIN: "trikzik-owner-auth.firebaseapp.com", FIREBASE_APP_ID: "app", FIREBASE_API_KEY: "public-web-key" }, response = await dashboard({ request: new Request("https://preview.example/owner/analytics"), env: pageEnv }), body = await response.text(); assert.equal(response.status, 200);
for (const value of ["My Lab", "Find a project", "Needs attention", "All projects", "Saved decisions", "projectNodes", "saveStates", "const generation=state.generation,controller=new AbortController(),current=()=", "setCardBusy(projectNodes.get(id)||card,false)", "retryKey", "expectedRevision", "response.status===409", "applyProjectFilters", "Save failed. Your draft is still here", "Nothing saved. Your note is still here", "textContent"]) assert.match(body, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(body, /Pocket Mote|ET TV|C0C6TMLFJBZ|1791328857088279|776aab5c|3c311b019103430facb3972993386e6c51869580/); assert.doesNotMatch(body, /innerHTML|service.?account|private.?key/i); assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});
