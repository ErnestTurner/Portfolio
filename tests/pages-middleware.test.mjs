import assert from "node:assert/strict";
import test from "node:test";
import { onRequest, repositoryOnly } from "../functions/_middleware.js";

test("repository-only namespaces and private seed names are blocked", async () => {
  const paths = [
    "/scripts/my-lab-delivery.mjs",
    "/migrations/0004_my_lab_delivery.sql",
    "/tests/my-lab.test.mjs",
    "/docs/release.md",
    "/.git/config",
    "/.reference/item",
    "/.wrangler/cache/pages.json",
    "/functions/owner/api/lab.js",
    "/reference-mobile/sample.png",
    "/trikzik-my-lab-projects.sql",
  ];
  for (const path of paths) {
    assert.equal(repositoryOnly(path), true);
    let continued = false;
    const response = await onRequest({ request: new Request(`https://preview.example${path}`), next: () => { continued = true; } });
    assert.equal(continued, false);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("public and owner routes continue through the Pages pipeline", async () => {
  for (const path of ["/", "/assets/favicon-48.png", "/games/moon-snail/", "/owner/analytics", "/owner/api/lab"]) {
    assert.equal(repositoryOnly(path), false);
    const expected = new Response(null, { status: 204 });
    const response = await onRequest({ request: new Request(`https://preview.example${path}`), next: () => expected });
    assert.equal(response, expected);
  }
});
