#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DATABASE = "trikzik-analytics-test";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const commands = new Set(["list", "show", "queue-existing", "queue-test", "delivered", "accepted", "completed"]);
const states = ["queued", "delivered", "accepted", "completed"];
const select = "delivery_id,record_type,project,project_name,decision_revision,decision,note,scope,source_revision,source_request_id,destination_type,destination_ref,status,queued_at,delivered_at,delivered_receipt_id,delivered_receipt_url,accepted_at,accepted_by,accepted_note,accepted_receipt_id,accepted_receipt_url,completed_at,completion_note,completion_receipt_id,completion_receipt_url";

export function parseArgs(argv) {
  const command = argv[0];
  if (!commands.has(command)) throw new Error("Command must be list, show, queue-existing, queue-test, delivered, accepted, or completed");
  const values = {};
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index], value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("Arguments must be --name value pairs");
    const name = key.slice(2);
    if (Object.hasOwn(values, name)) throw new Error(`Duplicate argument: ${key}`);
    values[name] = value;
  }
  return { command, values };
}

function bounded(value, name, max, pattern) {
  if (typeof value !== "string" || !value || value.length > max || /[\u0000-\u001f\u007f]/.test(value) || (pattern && !pattern.test(value))) throw new Error(`Invalid ${name}`);
  return value;
}

function uuid(value, name = "delivery id") { return bounded(value, name, 36, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); }
function project(value) { return bounded(value, "project", 48, /^[a-z0-9_]{2,48}$/); }
function revision(value) { const number = Number(value); if (!Number.isSafeInteger(number) || number < 1 || number > 1000000) throw new Error("Invalid revision"); return number; }
function receiptId(value) { return bounded(value, "Slack receipt id", 80, /^\d{10,}\.[0-9]{6}$/); }
function note(value, name, max) { return bounded(value, name, max); }
function slackUrl(value, name) {
  bounded(value, name, 300);
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "trikziklabs.slack.com" || !/^\/archives\/[A-Z0-9]+\/p\d+$/.test(url.pathname)) throw new Error(`Invalid ${name}`);
  return url.href;
}
function sql(value) { return `'${String(value).replaceAll("'", "''")}'`; }

function parseWrangler(stdout) {
  const value = JSON.parse(stdout);
  if (value?.error) throw new Error(value.error.text || value.error.message || "Cloudflare API error");
  const batches = Array.isArray(value) ? value : [value];
  const failed = batches.find(batch => batch?.success === false || batch?.error);
  if (failed) throw new Error(failed.error?.text || failed.error?.message || "D1 query failed");
  return batches.flatMap(batch => Array.isArray(batch?.results) ? batch.results : []);
}

export function createRunner(spawn = spawnSync) {
  return function runSql(statement) {
    const npxCli = resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
    const result = spawn(process.execPath, [npxCli, "wrangler", "d1", "execute", DATABASE, "--remote", "--command", statement, "--json"], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 });
    if (result.status !== 0) throw new Error((result.error?.message || result.stderr || result.stdout || "Wrangler failed").trim());
    return parseWrangler(result.stdout);
  };
}

function get(runSql, id) { return runSql(`SELECT ${select} FROM owner_lab_deliveries WHERE delivery_id=${sql(uuid(id))} LIMIT 1`)[0] || null; }
function same(row, fields) { return Object.entries(fields).filter(([key]) => !key.endsWith("_at")).every(([key, value]) => String(row[key] ?? "") === String(value)); }

function transition(runSql, id, from, to, fields) {
  const current = get(runSql, id);
  if (!current) throw new Error("Delivery record not found");
  const currentIndex = states.indexOf(current.status), targetIndex = states.indexOf(to);
  if (currentIndex >= targetIndex) {
    if (same(current, fields)) return { repeated: true, delivery: current };
    throw new Error("A different receipt is already recorded; reconcile the destination before any resend");
  }
  if (current.status !== from) throw new Error(`Out-of-order transition: ${current.status} cannot become ${to}`);
  const assignments = [`status=${sql(to)}`, ...Object.entries(fields).map(([key, value]) => `${key}=${typeof value === "number" ? value : sql(value)}`)];
  const changed = runSql(`UPDATE owner_lab_deliveries SET ${assignments.join(",")} WHERE delivery_id=${sql(id)} AND status=${sql(from)} RETURNING ${select}`)[0];
  if (changed) return { repeated: false, delivery: changed };
  const reconciled = get(runSql, id);
  if (reconciled && states.indexOf(reconciled.status) >= targetIndex && same(reconciled, fields)) return { repeated: true, delivery: reconciled };
  throw new Error("Transition outcome is ambiguous; read and reconcile the record before retrying");
}

export function operate(command, values, runSql = createRunner()) {
  if (command === "list") return { deliveries: runSql(`SELECT ${select} FROM owner_lab_deliveries WHERE status <> 'completed' ORDER BY queued_at,delivery_id LIMIT 100`) };
  if (command === "show") return { delivery: get(runSql, values.id) };
  if (command === "queue-existing") {
    const id = randomUUID(), projectId = project(values.project), decisionRevision = revision(values.revision), destination = slackUrl(values.destination, "destination");
    const existing = runSql(`SELECT ${select} FROM owner_lab_deliveries WHERE record_type='owner_decision' AND project=${sql(projectId)} AND decision_revision=${decisionRevision} LIMIT 1`)[0];
    if (existing) {
      if (existing.destination_type === "slack_thread" && existing.destination_ref === destination) return { repeated: true, delivery: existing };
      throw new Error("This decision revision already has a different immutable delivery record");
    }
    const now = Math.floor(Date.now() / 1000);
    const statement = `BEGIN; INSERT INTO owner_lab_deliveries(delivery_id,record_type,project,project_name,decision_revision,decision,note,scope,source_revision,source_request_id,destination_type,destination_ref,status,queued_at) SELECT ${sql(id)},'owner_decision',d.project,p.name,d.revision,d.decision,d.note,p.scope,p.source_revision,d.request_id,'slack_thread',${sql(destination)},'queued',${now} FROM owner_lab_decisions d JOIN owner_lab_projects p ON p.project=d.project WHERE d.project=${sql(projectId)} AND d.revision=${decisionRevision} AND d.queued_delivery_id IS NULL; UPDATE owner_lab_decisions SET queued_delivery_id=${sql(id)} WHERE project=${sql(projectId)} AND revision=${decisionRevision} AND queued_delivery_id IS NULL AND EXISTS(SELECT 1 FROM owner_lab_deliveries WHERE delivery_id=${sql(id)}); COMMIT; SELECT ${select} FROM owner_lab_deliveries WHERE delivery_id=${sql(id)} LIMIT 1;`;
    const delivery = runSql(statement).at(-1);
    if (!delivery) throw new Error("Decision revision is unavailable or already queued; inspect before retrying");
    return { repeated: false, delivery };
  }
  if (command === "queue-test") {
    const destination = slackUrl(values.destination, "destination"), sourceRevision = bounded(values["source-revision"], "source revision", 64, /^[0-9a-f]{7,64}$/i);
    const existing = runSql(`SELECT ${select} FROM owner_lab_deliveries WHERE record_type='synthetic_test' AND project='delivery_test' AND decision_revision=1 LIMIT 1`)[0];
    if (existing) {
      if (existing.destination_ref === destination && existing.source_revision === sourceRevision) return { repeated: true, delivery: existing };
      throw new Error("The single synthetic delivery test already exists with different immutable content");
    }
    const id = randomUUID(), now = Math.floor(Date.now() / 1000), scope = "delivery test; no project work authorized", content = "Synthetic preview-only delivery test. Confirm receipt only; do not start project work.";
    const delivery = runSql(`INSERT INTO owner_lab_deliveries(delivery_id,record_type,project,project_name,decision_revision,decision,note,scope,source_revision,source_request_id,destination_type,destination_ref,status,queued_at) VALUES(${sql(id)},'synthetic_test','delivery_test','My Lab delivery test',1,'delivery_test',${sql(content)},${sql(scope)},${sql(sourceRevision)},NULL,'slack_thread',${sql(destination)},'queued',${now}) RETURNING ${select}`)[0];
    if (!delivery) throw new Error("Synthetic delivery test was not created");
    return { repeated: false, delivery };
  }
  const id = uuid(values.id), now = Math.floor(Date.now() / 1000), url = slackUrl(values["receipt-url"], "receipt URL"), receipt = receiptId(values["receipt-id"]);
  if (command === "delivered") return transition(runSql, id, "queued", "delivered", { delivered_at: now, delivered_receipt_id: receipt, delivered_receipt_url: url });
  if (command === "accepted") return transition(runSql, id, "delivered", "accepted", { accepted_at: now, accepted_by: note(values.by, "accepted by", 100), accepted_note: note(values.note, "acceptance note", 400), accepted_receipt_id: receipt, accepted_receipt_url: url });
  if (command === "completed") return transition(runSql, id, "accepted", "completed", { completed_at: now, completion_note: note(values.note, "completion note", 500), completion_receipt_id: receipt, completion_receipt_url: url });
  throw new Error("Unsupported command");
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const { command, values } = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(operate(command, values), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
