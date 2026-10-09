const BLOCKED_PREFIXES = Object.freeze([
  "/.git",
  "/.reference",
  "/.wrangler",
  "/docs",
  "/functions",
  "/migrations",
  "/reference-mobile",
  "/scripts",
  "/tests",
]);

function repositoryOnly(pathname) {
  const lower = pathname.toLowerCase();
  return BLOCKED_PREFIXES.some(prefix => lower === prefix || lower.startsWith(`${prefix}/`))
    || /^\/[^/]*my-lab[^/]*\.sql$/i.test(pathname);
}

export async function onRequest(context) {
  if (!repositoryOnly(new URL(context.request.url).pathname)) return context.next();
  return new Response("Not found", { status: 404, headers: {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  }});
}

export { repositoryOnly };
