# Production analytics release checklist

Status: prepared, not applied. Preview collection remains off and production is unchanged.

## Data contract

The public client can submit only these fixed event names: `specimen_select`, `experiment_open`, `first_interaction`, `export`, `share`, and `support_click`.

Each request contains exactly six fields: `event`, `experiment`, `source`, `format`, `context`, and `release`. Every value is checked against a fixed server allowlist. The client and collector do not accept or store visitor/session identifiers, names, email addresses, IP addresses, referrers, raw URLs or query strings, replay payloads, free-form text, control values, pointer trails, artwork, or animation frames.

## Production resources and variables

Create a new, empty D1 database for production. Apply `migrations/0001_analytics.sql`, verify both tables, the range index, and retention trigger exist, and verify both `analytics_events` and `ingest_windows` contain zero rows before binding it as `TRIKZIK_DB`.

Deploy first with collection disabled:

```text
ANALYTICS_ENABLED=false
ANALYTICS_CONTEXT=production
ANALYTICS_ALLOWED_ORIGINS=https://trikzik.com,https://www.trikzik.com
ANALYTICS_DASHBOARD_ENABLED=true
ANALYTICS_OWNER_HOSTS=trikzik.com
ANALYTICS_QUERY_CONTEXT=production
FIREBASE_PROJECT_ID=trikzik-owner-auth
FIREBASE_AUTH_DOMAIN=trikzik-owner-auth.firebaseapp.com
FIREBASE_APP_ID=1:639399568921:web:05a6aa0b4e3393a272ac88
FIREBASE_API_KEY=<existing public Firebase web key>
FIREBASE_OWNER_EMAIL=<confirmed exact owner email>
FIREBASE_OWNER_UID=<confirmed exact owner UID>
```

The email and UID must be entered as environment variables in Cloudflare, not committed here. No service-account key, Cloudflare API token, or analytics query token is required by this D1 design.

## Two-step activation

1. Deploy the approved release with `ANALYTICS_ENABLED=false`.
2. Verify the homepage, all eight experiments, replay links, `/privacy.html`, collector configuration, disabled POST response, exact owner sign-in, production dashboard context, and zero production rows.
3. Change only `ANALYTICS_ENABLED` to `true`.
4. Verify one allowlisted event end to end, confirm its aggregate production row, confirm no test rows exist in the production database, and recheck the owner dashboard.

Test fixtures remain only in the separately bound preview D1 database. Production uses a different D1 database ID and `ANALYTICS_QUERY_CONTEXT=production`; no data is copied between them.

## Rollback

Set `ANALYTICS_ENABLED=false` first. The same-origin configuration endpoint will then prevent public clients from sending events, while games continue to work. If the release itself must be rolled back, redeploy the previous production commit after disabling collection. Keep the production database intact for review unless deletion is separately approved.

## Capacity and cost guardrails

The collector accepts at most 12 events globally per minute, stores five-minute aggregate buckets, caps client attempts at 16 per page, and retains a 90-day query horizon. Cloudflare currently documents 100,000 Workers/Pages Functions requests per day on the free plan, and D1 free-plan allowances of 5 million rows read per day, 100,000 rows written per day, and 5 GB total storage. Limits and pricing can change; confirm the current Cloudflare documentation immediately before activation.
