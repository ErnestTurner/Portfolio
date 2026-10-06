import { requireOwner, sameOriginApiRequest, unavailable } from "../../_shared/access.js";

const RANGES = Object.freeze({ "24h": 86400, "7d": 604800, "30d": 2592000, "90d": 7776000 });
const AGGREGATE_SQL = "SELECT event,experiment,source,format,release,SUM(count) AS total FROM analytics_events WHERE context=? AND bucket_start>=? AND bucket_start<? GROUP BY event,experiment,source,format,release ORDER BY total DESC LIMIT 500";
const LATEST_SQL = "SELECT MAX(bucket_start) AS latest_bucket FROM analytics_events WHERE context=?";

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: {
    "cache-control": "private, no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer",
    "vary": "Authorization",
    "x-content-type-options": "nosniff",
  }});
}

function cleanRows(value) {
  return (Array.isArray(value) ? value : []).slice(0, 500).flatMap(row => {
    if (!row || typeof row !== "object") return [];
    const total = Number(row.total);
    if (!Number.isSafeInteger(total) || total < 0) return [];
    return [{
      event: String(row.event || "").slice(0, 32),
      experiment: String(row.experiment || "").slice(0, 32),
      source: String(row.source || "").slice(0, 32),
      format: String(row.format || "").slice(0, 16),
      release: String(row.release || "").slice(0, 32),
      total,
    }];
  });
}

function period(start, end, rows) {
  return {
    startAt: new Date(start * 1000).toISOString(),
    endAt: new Date(end * 1000).toISOString(),
    rows: cleanRows(rows),
  };
}

export async function onRequestGet({ request, env }) {
  if (env.ANALYTICS_DASHBOARD_ENABLED !== "true" || !env.TRIKZIK_DB?.prepare) return unavailable();
  const context = String(env.ANALYTICS_QUERY_CONTEXT || "");
  if (!["production", "preview", "test"].includes(context)) return unavailable();
  if (!sameOriginApiRequest(request, env)) return json(403, { error: "Request rejected" });
  const access = await requireOwner(request, env);
  if (!access.ok) return access.response;

  const requested = new URL(request.url).searchParams.get("range");
  const range = RANGES[requested] ? requested : "7d";
  const end = Math.floor(Date.now() / 1000);
  const start = end - RANGES[range];
  const priorStart = start - RANGES[range];

  try {
    const currentStatement = env.TRIKZIK_DB.prepare(AGGREGATE_SQL).bind(context, start, end);
    const priorStatement = env.TRIKZIK_DB.prepare(AGGREGATE_SQL).bind(context, priorStart, start);
    const latestStatement = env.TRIKZIK_DB.prepare(LATEST_SQL).bind(context);
    let currentResult, priorResult, latestResult;
    if (typeof env.TRIKZIK_DB.batch === "function") {
      [currentResult, priorResult, latestResult] = await env.TRIKZIK_DB.batch([currentStatement, priorStatement, latestStatement]);
    } else {
      [currentResult, priorResult, latestResult] = await Promise.all([currentStatement.all(), priorStatement.all(), latestStatement.first()]);
    }
    const latestBucket = Number(latestResult?.latest_bucket ?? latestResult?.results?.[0]?.latest_bucket);
    return json(200, {
      range,
      context,
      generatedAt: new Date().toISOString(),
      current: period(start, end, currentResult?.results),
      prior: period(priorStart, start, priorResult?.results),
      health: {
        collectionEnabled: env.ANALYTICS_ENABLED === "true",
        queryOk: true,
        lastEventAt: Number.isFinite(latestBucket) ? new Date(latestBucket * 1000).toISOString() : null,
        retentionDays: 90,
        bucketMinutes: 5,
        syntheticTestData: context === "test",
      },
    });
  } catch {
    return json(503, { error: "Analytics query unavailable" });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
