#!/usr/bin/env node
import { cp, lstat, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_FILES = Object.freeze([
  "_headers",
  "404.html",
  "analytics.js",
  "favicon.ico",
  "feedback.html",
  "google868251fe5116797f.html",
  "index.html",
  "playground.css",
  "privacy.html",
  "robots.txt",
  "sitemap.xml",
  "surprise.js",
]);

export const PUBLIC_FILES = Object.freeze([
  "games/lab-shell.css",
  "games/dungeon-reset/build-manifest.json",
  "games/dungeon-reset/core.js",
  "games/dungeon-reset/game.js",
  "games/dungeon-reset/index.html",
  "games/dungeon-reset/style.css",
  "games/dungeon-reset/vendor/PHASER-LICENSE.md",
  "games/dungeon-reset/vendor/phaser.min.js",
]);

export const PUBLIC_DIRECTORIES = Object.freeze([
  "assets",
  "games/brain-in-a-jar",
  "games/dungeon-reset/assets",
  "games/jelly-bench",
  "games/mirror-mischief",
  "games/moon-snail",
  "games/scribble-engine",
  "games/starfall",
  "games/traffic-with-no-excuse",
  "pocket-mote/privacy",
]);

export const EXCLUDED_TOP_LEVEL = Object.freeze([
  ".git",
  ".reference",
  ".wrangler",
  "docs",
  "functions",
  "migrations",
  "reference-mobile",
  "scripts",
  "tests",
]);

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const artifactRoot = join(repositoryRoot, ".pages-artifact");

function sourcePath(relativePath) {
  const target = resolve(repositoryRoot, relativePath);
  if (relative(repositoryRoot, target).startsWith("..")) throw new Error(`Unsafe source path: ${relativePath}`);
  return target;
}

async function copyChecked(relativePath, expectedDirectory) {
  const source = sourcePath(relativePath);
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${relativePath}`);
  if (info.isDirectory() !== expectedDirectory) throw new Error(`Unexpected source type: ${relativePath}`);
  const destination = join(artifactRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: expectedDirectory, errorOnExist: true, force: false, verbatimSymlinks: false });
}

async function countFiles(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Artifact contains a symbolic link: ${target}`);
    count += entry.isDirectory() ? await countFiles(target) : 1;
  }
  return count;
}

export async function buildArtifact() {
  if (artifactRoot !== join(repositoryRoot, ".pages-artifact")) throw new Error("Unexpected artifact target");
  await rm(artifactRoot, { recursive: true, force: true });
  await mkdir(artifactRoot, { recursive: false });
  for (const relativePath of [...ROOT_FILES, ...PUBLIC_FILES].sort()) await copyChecked(relativePath, false);
  for (const relativePath of [...PUBLIC_DIRECTORIES].sort()) await copyChecked(relativePath, true);
  for (const name of EXCLUDED_TOP_LEVEL) {
    try { await stat(join(artifactRoot, name)); throw new Error(`Excluded path entered artifact: ${name}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return { directory: artifactRoot, files: await countFiles(artifactRoot) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(`${JSON.stringify(await buildArtifact())}\n`); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
