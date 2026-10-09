import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const { onRequestGet: readLab, onRequestPost: saveLab } = await import("../functions/owner/api/lab.js");
const { onRequestGet: dashboard } = await import("../functions/owner/analytics.js");

function labDb(initial = null) {
  let row = initial;
  const calls = [];
  return {
    calls,
    get row() { return row; },
    prepare(sql) {
      const call = { sql, args: [] };
      calls.push(call);
      return {
        bind(...args) { call.args = args; return this; },
        async first() {
          if (sql.startsWith("SELECT")) return row;
          if (sql.startsWith("INSERT")) {
            if (row) return null;
            row = { project: call.args[0], revision: 1, decision: call.args[1], note: call.args[2], saved_at: call.args[3], request_id: call.args[4] };
            return { ...row };
          }
          if (sql.startsWith("UPDATE")) {
            if (!row || row.project !== call.args[4] || row.revision !== call.args[5]) return null;
            row = { project: call.args[4], revision: row.revision + 1, decision: call.args[0], note: call.args[1], saved_at: call.args[2], request_id: call.args[3] };
            return { ...row };
          }
          throw new Error("Unexpected SQL");
        },
      };
    },
  };
}

function b64(value) { return Buffer.from(value).toString("base64url"); }

async function tokenFixture() {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  Object.assign(jwk, { kid: "my-lab-test-key", alg: "RS256", use: "sig" });
  const now = Math.floor(Date.now() / 1000);
  async function token(overrides = {}) {
    const header = b64(JSON.stringify({ alg: "RS256", kid: jwk.kid, typ: "JWT" }));
    const claims = b64(JSON.stringify({ aud: "trikzik-owner-auth", iss: "https://securetoken.google.com/trikzik-owner-auth", sub: "owner-uid-123", user_id: "owner-uid-123", email: "owner@example.test", email_verified: true, iat: now - 10, auth_time: now - 20, exp: now + 300, ...overrides }));
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${header}.${claims}`));
    return `${header}.${claims}.${b64(signature)}`;
  }
  return { token, fetch: async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }) };
}

const fixturePromise = tokenFixture();
const requestIdA = "11111111-1111-4111-8111-111111111111";
const requestIdB = "22222222-2222-4222-8222-222222222222";

function env(db) {
  return {
    ANALYTICS_DASHBOARD_ENABLED: "true",
    ANALYTICS_OWNER_HOSTS: "preview.example",
    ANALYTICS_QUERY_CONTEXT: "test",
    FIREBASE_PROJECT_ID: "trikzik-owner-auth",
    FIREBASE_OWNER_EMAIL: "owner@example.test",
    FIREBASE_OWNER_UID: "owner-uid-123",
    TRIKZIK_DB: db,
  };
}

async function ownerHeaders(overrides = {}) {
  const fixture = await fixturePromise;
  return { authorization: `Bearer ${await fixture.token(overrides)}`, origin: "https://preview.example", "sec-fetch-site": "same-origin" };
}

function getRequest(headers) {
  return new Request("https://preview.example/owner/api/lab", { headers });
}

function postRequest(body, headers, contentType = "application/json") {
  return new Request("https://preview.example/owner/api/lab", { method: "POST", headers: { ...headers, "content-type": contentType }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

test("My Lab API fails closed for signed-out, wrong-owner, cross-site, production, and unbound requests", async () => {
  const fixture = await fixturePromise, db = labDb(), base = env(db), original = globalThis.fetch;
  globalThis.fetch = fixture.fetch;
  try {
    assert.equal((await readLab({ request: getRequest({ origin: "https://preview.example", "sec-fetch-site": "same-origin" }), env: base })).status, 401);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders({ email: "wrong@example.test" })), env: base })).status, 401);
    assert.equal((await readLab({ request: getRequest({ ...(await ownerHeaders()), "sec-fetch-site": "cross-site" }), env: base })).status, 403);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders()), env: { ...base, ANALYTICS_QUERY_CONTEXT: "production" } })).status, 404);
    assert.equal((await readLab({ request: getRequest(await ownerHeaders()), env: { ...base, TRIKZIK_DB: null } })).status, 404);
    assert.equal(db.calls.length, 0);
  } finally { globalThis.fetch = original; }
});

test("My Lab returns one factual Scribble card with an explicit undelivered workflow", async () => {
  const fixture = await fixturePromise, db = labDb(), original = globalThis.fetch;
  globalThis.fetch = fixture.fetch;
  try {
    const response = await readLab({ request: getRequest(await ownerHeaders()), env: env(db) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const data = await response.json();
    assert.equal(data.project.id, "scribble");
    assert.equal(data.project.commit, "3c311b019103430facb3972993386e6c51869580");
    assert.match(data.project.previewUrl, /^https:\/\/776aab5c\.ernest-turner\.pages\.dev\//);
    assert.equal(data.project.testResult, "29 automated tests passed");
    assert.equal(data.workflow.decision, "pending");
    assert.equal(data.workflow.savedState, "not_saved");
    assert.equal(data.workflow.deliveryState, "not_delivered");
    assert.equal(data.delivery.connected, false);
    assert.match(data.delivery.explanation, /No supported dashboard route/);
    assert.equal(db.calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test("owner decisions save durably, retry idempotently, and reject stale revisions", async () => {
  const fixture = await fixturePromise, db = labDb(), headers = await ownerHeaders(), original = globalThis.fetch;
  globalThis.fetch = fixture.fetch;
  const first = { project: "scribble", decision: "approved", note: "Phone review passed.", expectedRevision: 0, requestId: requestIdA };
  try {
    const savedResponse = await saveLab({ request: postRequest(first, headers), env: env(db) });
    assert.equal(savedResponse.status, 200);
    const saved = await savedResponse.json();
    assert.equal(saved.workflow.revision, 1);
    assert.equal(saved.workflow.decision, "approved");
    assert.equal(saved.workflow.note, "Phone review passed.");
    assert.equal(saved.workflow.deliveryState, "not_delivered");
    assert.equal(saved.repeated, false);

    const retryResponse = await saveLab({ request: postRequest(first, headers), env: env(db) });
    assert.equal(retryResponse.status, 200);
    assert.equal((await retryResponse.json()).repeated, true);
    assert.equal(db.row.revision, 1);

    const stale = { ...first, decision: "parked", note: "Later.", requestId: requestIdB };
    const staleResponse = await saveLab({ request: postRequest(stale, headers), env: env(db) });
    assert.equal(staleResponse.status, 409);
    assert.equal((await staleResponse.json()).workflow.decision, "approved");
    assert.equal(db.row.revision, 1);

    const updated = { ...stale, expectedRevision: 1 };
    const updatedResponse = await saveLab({ request: postRequest(updated, headers), env: env(db) });
    assert.equal(updatedResponse.status, 200);
    assert.equal((await updatedResponse.json()).workflow.revision, 2);

    const reloaded = await readLab({ request: getRequest(headers), env: env(db) });
    const data = await reloaded.json();
    assert.equal(data.workflow.decision, "parked");
    assert.equal(data.workflow.note, "Later.");
  } finally { globalThis.fetch = original; }
});

test("decision writes require exact bounded JSON and never accept delivery claims", async () => {
  const fixture = await fixturePromise, headers = await ownerHeaders(), original = globalThis.fetch;
  globalThis.fetch = fixture.fetch;
  const valid = { project: "scribble", decision: "approved", note: "", expectedRevision: 0, requestId: requestIdA };
  try {
    assert.equal((await saveLab({ request: postRequest(valid, headers, "text/plain"), env: env(labDb()) })).status, 415);
    assert.equal((await saveLab({ request: postRequest({ ...valid, decision: "delivered" }, headers), env: env(labDb()) })).status, 400);
    assert.equal((await saveLab({ request: postRequest({ ...valid, delivered: true }, headers), env: env(labDb()) })).status, 400);
    assert.equal((await saveLab({ request: postRequest({ ...valid, note: "x".repeat(401) }, headers), env: env(labDb()) })).status, 400);
    assert.equal((await saveLab({ request: postRequest({ ...valid, requestId: "not-a-uuid" }, headers), env: env(labDb()) })).status, 400);
    assert.equal((await saveLab({ request: postRequest("x".repeat(1100), headers), env: env(labDb()) })).status, 413);
  } finally { globalThis.fetch = original; }
});

test("My Lab migration is preview-safe and stores only bounded owner decision state", async () => {
  const sql = await readFile(new URL("../migrations/0002_my_lab.sql", import.meta.url), "utf8");
  assert.match(sql, /PRIMARY KEY CHECK \(project = 'scribble'\)/);
  assert.match(sql, /approved','changes_requested','parked/);
  assert.match(sql, /length\(note\) <= 400/);
  assert.match(sql, /request_id TEXT NOT NULL UNIQUE/);
  assert.doesNotMatch(sql, /delivered|accepted|completed|email|token|conversation|slack/i);
});

test("dashboard keeps project evidence behind owner APIs and makes save versus delivery explicit", async () => {
  const pageEnv = { ANALYTICS_DASHBOARD_ENABLED: "true", ANALYTICS_OWNER_HOSTS: "preview.example", FIREBASE_PROJECT_ID: "trikzik-owner-auth", FIREBASE_AUTH_DOMAIN: "trikzik-owner-auth.firebaseapp.com", FIREBASE_APP_ID: "app", FIREBASE_API_KEY: "public-web-key" };
  const response = await dashboard({ request: new Request("https://preview.example/owner/analytics"), env: pageEnv });
  const body = await response.text();
  assert.equal(response.status, 200);
  for (const text of ["My Lab", "Ready for you", "Needs your say", "Underway", "Approve direction", "Request a change", "Park for now", "Save to My Lab", "Waiting for delivery", "Signals", "/owner/api/lab", "crypto.randomUUID()", "expectedRevision", "response.status===409", "saveInFlight", "cancelSave()", "textContent"] ) assert.match(body, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(body, /776aab5c|3c311b019103430facb3972993386e6c51869580|C0C7669U84S|1791531767/);
  assert.doesNotMatch(body, /innerHTML|service.?account|private.?key/i);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});
