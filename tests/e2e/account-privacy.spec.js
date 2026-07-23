// The account-switch privacy scenario in a REAL browser with the fake
// backend: A's events vanish at logout, B sees nothing, A's events come back
// automatically at re-login (no manual Pull).

import { test, expect } from "@playwright/test";
import { bootApp, quickAdd } from "./helpers.js";

test("A→B→A in the browser: logout scrubs, B is clean, A auto-restores", async ({ page }) => {
  test.setTimeout(120000);
  await bootApp(page);

  // The privacy clear has a 15s wall-clock dedupe window; skew the page clock
  // between steps like a real user's slower pace would.
  await page.evaluate(() => {
    window.__clockSkew = 0;
    const realNow = Date.now.bind(Date);
    Date.now = () => realNow() + window.__clockSkew;
  });
  const skew = (ms) => page.evaluate((m) => { window.__clockSkew += m; }, ms);

  // ---- A signs in and creates a private event -----------------------------
  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    server.addUser("b@example.com", "pw");
    await server.signIn("a@example.com");
  });
  await page.waitForTimeout(1000);

  await quickAdd(page, "A secret meeting tomorrow 9am");
  await expect(page.locator("#grid")).toContainText("A secret meeting");

  // Push A's data to the fake cloud through the real pipeline.
  await page.evaluate(async () => { await window.writeCloudStateNow(["events"]); });

  // ---- A signs out: the grid must no longer show A's event ----------------
  await skew(20000);
  await page.evaluate(async () => { await window.logoutCloud(); });
  await page.waitForTimeout(1000);
  await expect(page.locator("#grid")).not.toContainText("A secret meeting");

  // ---- B signs in: still nothing of A's -----------------------------------
  await skew(20000);
  await page.evaluate(async () => {
    await window.__vanguardFakeSupabaseServer.signIn("b@example.com");
  });
  await page.waitForTimeout(1500);
  await expect(page.locator("#grid")).not.toContainText("A secret meeting");

  // ---- B out, A back in: the event returns WITHOUT any manual Pull --------
  await skew(20000);
  await page.evaluate(async () => { await window.logoutCloud(); });
  await page.waitForTimeout(800);
  await skew(20000);
  await page.evaluate(async () => {
    await window.__vanguardFakeSupabaseServer.signIn("a@example.com");
  });
  await page.waitForTimeout(2000);
  await expect(page.locator("#grid")).toContainText("A secret meeting");

  // The built-in audit must fully pass too.
  const audit = await page.evaluate(() => window.testAccountSwitchSafety());
  expect(audit.filter((l) => l.startsWith("FAIL"))).toEqual([]);
});
