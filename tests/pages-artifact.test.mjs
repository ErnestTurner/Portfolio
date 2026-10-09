import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";
import { artifactRoot, buildArtifact, EXCLUDED_TOP_LEVEL, PUBLIC_DIRECTORIES, PUBLIC_FILES, ROOT_FILES } from "../scripts/build-pages-artifact.mjs";

async function filesBelow(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    assert.equal(entry.isSymbolicLink(), false);
    if (entry.isDirectory()) found.push(...await filesBelow(target));
    else found.push(relative(artifactRoot, target).replaceAll("\\", "/"));
  }
  return found.sort();
}

test("Pages artifact contains only the explicit public allowlist", async () => {
  const result = await buildArtifact();
  assert.equal(result.directory, artifactRoot);
  for (const path of [...ROOT_FILES, ...PUBLIC_FILES]) assert.equal((await stat(join(artifactRoot, path))).isFile(), true);
  for (const path of PUBLIC_DIRECTORIES) assert.equal((await stat(join(artifactRoot, path))).isDirectory(), true);
  for (const path of EXCLUDED_TOP_LEVEL) await assert.rejects(stat(join(artifactRoot, path)), { code: "ENOENT" });
  const files = await filesBelow(artifactRoot);
  assert.equal(files.length, result.files);
  assert.ok(files.includes("games/moon-snail/index.html"));
  assert.ok(files.includes("games/dungeon-reset/vendor/PHASER-LICENSE.md"));
  assert.ok(files.includes("pocket-mote/privacy/index.html"));
  assert.ok(files.includes("_headers"));
});

test("Pages artifact contains no credential shapes or private delivery seed", async () => {
  const files = await filesBelow(artifactRoot);
  const textFiles = files.filter(path => /\.(?:css|html|js|json|md|svg|txt|xml)$/i.test(path));
  const forbidden = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /sk-[A-Za-z0-9_-]{20,}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{10,}/,
    /hooks\.slack\.com\/services\//,
    /C0C7669U84S/,
    /1791479634\.510259/,
  ];
  for (const path of textFiles) {
    const content = await readFile(join(artifactRoot, path), "utf8");
    for (const pattern of forbidden) assert.equal(pattern.test(content), false, `${path} matched a forbidden pattern`);
  }
});
