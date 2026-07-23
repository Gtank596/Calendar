// check-duplicate-ids.js — fails when a first-party HTML file contains
// duplicate static `id` attributes.
//
// Uses a real HTML parser (jsdom), so ids inside HTML comments, <script>
// string literals, or example text can never produce false positives — only
// actual elements in the parsed DOM are counted.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = ["index.html"];

let failures = 0;

for (const rel of htmlFiles) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.error(`FAIL  ${rel} — file not found`);
    failures++;
    continue;
  }

  const html = readFileSync(abs, "utf8");
  // Scripts are NOT executed: jsdom only parses. Dynamic ids created at
  // runtime by script.js are covered by the Playwright duplicate-id test.
  const dom = new JSDOM(html);
  const counts = new Map();

  for (const el of dom.window.document.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    if (!id) continue;
    if (!counts.has(id)) counts.set(id, []);
    counts.get(id).push(el.tagName.toLowerCase());
  }

  const dupes = [...counts.entries()].filter(([, tags]) => tags.length > 1);
  if (dupes.length) {
    failures++;
    console.error(`FAIL  ${rel} — ${dupes.length} duplicated id(s):`);
    for (const [id, tags] of dupes) {
      console.error(`      #${id} appears ${tags.length} times (<${tags.join(">, <")}>)`);
    }
  } else {
    console.log(`ok    ${rel} — ${counts.size} unique static ids, no duplicates`);
  }

  dom.window.close();
}

console.log(`\ncheck:ids — ${htmlFiles.length} file(s) checked, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
