import assert from "node:assert/strict";
import test from "node:test";
import { operate, parseArgs } from "../scripts/my-lab-delivery.mjs";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const deliveredUrl = "https://trikziklabs.slack.com/archives/C0C7669U84S/p1791565000000000";
const acceptedUrl = "https://trikziklabs.slack.com/archives/C0C7669U84S/p1791565001000000";
const completedUrl = "https://trikziklabs.slack.com/archives/C0C7669U84S/p1791565002000000";

function queued(overrides = {}) {
  return { delivery_id: id, record_type: "synthetic_test", project: "delivery_test", project_name: "My Lab delivery test", decision_revision: 1, decision: "delivery_test", note: "Synthetic preview-only delivery test. Confirm receipt only; do not start project work.", scope: "delivery test; no project work authorized", source_revision: "abcdef1", source_request_id: null, destination_type: "slack_thread", destination_ref: "https://trikziklabs.slack.com/archives/C0C7669U84S/p1791479634510259", status: "queued", queued_at: 1, delivered_at: null, delivered_receipt_id: "", delivered_receipt_url: "", accepted_at: null, accepted_by: "", accepted_note: "", accepted_receipt_id: "", accepted_receipt_url: "", completed_at: null, completion_note: "", completion_receipt_id: "", completion_receipt_url: "", ...overrides };
}

function value(sql, key) { return sql.match(new RegExp(`${key}='([^']*)'`))?.[1].replaceAll("''", "'") || ""; }
function stateRunner(initial) {
  let row = { ...initial };
  const calls = [];
  return { calls, get row() { return { ...row }; }, run(sql) {
    calls.push(sql);
    if (sql.startsWith("SELECT")) return [{ ...row }];
    if (!sql.startsWith("UPDATE") || !sql.includes(`status='${row.status}'`)) return [];
    const next = value(sql, "status");
    if (next === "delivered") Object.assign(row, { status: next, delivered_at: 2, delivered_receipt_id: value(sql, "delivered_receipt_id"), delivered_receipt_url: value(sql, "delivered_receipt_url") });
    if (next === "accepted") Object.assign(row, { status: next, accepted_at: 3, accepted_by: value(sql, "accepted_by"), accepted_note: value(sql, "accepted_note"), accepted_receipt_id: value(sql, "accepted_receipt_id"), accepted_receipt_url: value(sql, "accepted_receipt_url") });
    if (next === "completed") Object.assign(row, { status: next, completed_at: 4, completion_note: value(sql, "completion_note"), completion_receipt_id: value(sql, "completion_receipt_id"), completion_receipt_url: value(sql, "completion_receipt_url") });
    return [{ ...row }];
  }};
}

test("operator arguments and receipt inputs are bounded", () => {
  assert.deepEqual(parseArgs(["show", "--id", id]), { command: "show", values: { id } });
  assert.throws(() => parseArgs(["unknown"]));
  assert.throws(() => parseArgs(["show", "--id"]));
  assert.throws(() => operate("delivered", { id: "bad", "receipt-url": deliveredUrl, "receipt-id": "1791565000.000000" }, () => []));
  assert.throws(() => operate("delivered", { id, "receipt-url": "https://evil.example/archives/C/p1", "receipt-id": "1791565000.000000" }, () => []));
  assert.throws(() => operate("delivered", { id, "receipt-url": deliveredUrl, "receipt-id": "bad" }, () => []));
});

test("synthetic queue record is explicit, bounded, and never impersonates an owner decision", () => {
  const calls = [], result = operate("queue-test", { destination: "https://trikziklabs.slack.com/archives/C0C7669U84S/p1791479634510259", "source-revision": "abcdef1" }, sql => {
    calls.push(sql);
    if (sql.startsWith("SELECT")) return [];
    assert.match(sql, /'synthetic_test'/); assert.match(sql, /'delivery_test'/); assert.match(sql, /delivery test; no project work authorized/); assert.match(sql, /do not start project work/); assert.doesNotMatch(sql, /owner_decision/);
    return [queued()];
  });
  assert.equal(result.delivery.record_type, "synthetic_test"); assert.equal(result.delivery.scope, "delivery test; no project work authorized"); assert.equal(calls.length, 2);
});

test("receipts advance only in order and exact duplicates are idempotent", () => {
  const state = stateRunner(queued());
  const delivered = operate("delivered", { id, "receipt-url": deliveredUrl, "receipt-id": "1791565000.000000" }, state.run); assert.equal(delivered.delivery.status, "delivered"); assert.equal(delivered.repeated, false);
  const duplicate = operate("delivered", { id, "receipt-url": deliveredUrl, "receipt-id": "1791565000.000000" }, state.run); assert.equal(duplicate.repeated, true); assert.throws(() => operate("delivered", { id, "receipt-url": acceptedUrl, "receipt-id": "1791565001.000000" }, state.run), /different receipt/);
  const accepted = operate("accepted", { id, "receipt-url": acceptedUrl, "receipt-id": "1791565001.000000", by: "Pip", note: "Accepted; no work started." }, state.run); assert.equal(accepted.delivery.status, "accepted"); assert.equal(accepted.delivery.accepted_by, "Pip");
  const completed = operate("completed", { id, "receipt-url": completedUrl, "receipt-id": "1791565002.000000", note: "Synthetic delivery loop verified." }, state.run); assert.equal(completed.delivery.status, "completed"); assert.equal(completed.delivery.completion_note, "Synthetic delivery loop verified.");
});

test("out-of-order and ambiguous transitions stop for reconciliation", () => {
  const state = stateRunner(queued());
  assert.throws(() => operate("accepted", { id, "receipt-url": acceptedUrl, "receipt-id": "1791565001.000000", by: "Pip", note: "Accepted." }, state.run), /Out-of-order/);
  const ambiguous = stateRunner(queued()); ambiguous.run = sql => sql.startsWith("SELECT") ? [ambiguous.row] : [];
  assert.throws(() => operate("delivered", { id, "receipt-url": deliveredUrl, "receipt-id": "1791565000.000000" }, ambiguous.run), /ambiguous/);
});
