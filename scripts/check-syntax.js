// check-syntax.js — syntax-checks every first-party JavaScript file.
//
// Production files (classic scripts) are parsed with the "script"/CommonJS
// goal; test/tooling files (ESM) are parsed with the "module" goal. Each file
// is copied to a temp directory with the extension that forces the right parse
// goal, then run through `node --check`, so results do not depend on the
// package.json "type" field or on Node version quirks.
//
// The production application is never executed here — `node --check` only
// parses.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Node 18-compatible recursive *.js walk (fs.globSync needs Node 22).
function walkJsFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsFiles(abs));
    else if (entry.name.endsWith(".js")) out.push(relative(root, abs).replace(/\\/g, "/"));
  }
  return out;
}

// [file, parseGoal] — "script" = classic browser script, "module" = ESM.
const targets = [
  ["script.js", "script"],
  ["service-worker.js", "script"],
  ["scripts/check-syntax.js", "module"],
  ["scripts/check-duplicate-ids.js", "module"],
  ["scripts/serve.js", "module"],
  ["vitest.config.js", "module"],
  ["playwright.config.js", "module"],
  ...walkJsFiles(join(root, "tests")).map(f => [f, "module"]),
];

const tempDir = mkdtempSync(join(tmpdir(), "vanguard-syntax-"));
let failures = 0;
let checked = 0;

try {
  for (const [rel, goal] of targets) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      console.error(`FAIL  ${rel} — file not found`);
      failures++;
      continue;
    }
    const ext = goal === "module" ? ".mjs" : ".cjs";
    const temp = join(tempDir, `check-${checked}-${basename(rel)}${ext}`);
    copyFileSync(abs, temp);
    try {
      execFileSync(process.execPath, ["--check", temp], { stdio: ["ignore", "pipe", "pipe"] });
      console.log(`ok    ${rel} (${goal})`);
    } catch (err) {
      failures++;
      const msg = (err.stderr || "").toString().replaceAll(temp, rel);
      console.error(`FAIL  ${rel} (${goal})\n${msg}`);
    }
    checked++;
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\ncheck:syntax — ${checked} files checked, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
