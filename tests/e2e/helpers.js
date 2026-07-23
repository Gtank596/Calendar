// Shared Playwright helpers.
//
// Network policy for EVERY e2e test:
//   * *.supabase.co is blocked — tests can never reach production Supabase.
//   * api.open-meteo.com is blocked — no live weather.
//   * The supabase CDN bundle is replaced with the deterministic fake
//     (tests/mocks/fake-supabase.global.js), which installs window.supabase
//     backed by an in-page fake server at window.__vanguardFakeSupabaseServer.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fakeSupabaseSource = readFileSync(
  join(root, "tests", "mocks", "fake-supabase.global.js"),
  "utf8"
);

/**
 * Locks down the network and collects uncaught page errors.
 * Call BEFORE page.goto. Returns the (live) error array.
 */
export async function hardenPage(page) {
  await page.route("**://*.supabase.co/**", (route) => route.abort());
  await page.route("**://api.open-meteo.com/**", (route) => route.abort());
  await page.route("**://cdn.jsdelivr.net/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeSupabaseSource })
  );
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

/** Standard boot into deterministic test mode. */
export async function bootApp(page, { testMode = true } = {}) {
  const errors = await hardenPage(page);
  await page.goto(testMode ? "/index.html?testMode=1" : "/index.html");
  await page.waitForSelector("#grid .day", { timeout: 15000 });
  return errors;
}

/** Create an event through the real Quick Add UI. Returns the typed title. */
export async function quickAdd(page, text) {
  await page.fill("#quickAddInput", text);
  await page.click("#quickAddBtn");
}

/** Assert no duplicate element ids exist in the LIVE (post-JS) DOM. */
export async function expectNoDuplicateIdsLive(page, expect) {
  const dupes = await page.evaluate(() => {
    const seen = new Map();
    for (const el of document.querySelectorAll("[id]")) {
      seen.set(el.id, (seen.get(el.id) || 0) + 1);
    }
    return [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
  });
  expect(dupes, `duplicate ids in live DOM: ${dupes.join(", ")}`).toEqual([]);
}
