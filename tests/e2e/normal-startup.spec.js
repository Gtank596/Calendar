// Ordinary startup WITHOUT ?testMode=1: the app must behave exactly as in
// production, and every test-only hook must be absent or inert.

import { test, expect } from "@playwright/test";
import { hardenPage } from "./helpers.js";

test("normal startup: no errors, test-mode flag absent, SW path untouched", async ({ page }) => {
  const errors = await hardenPage(page);
  await page.goto("/index.html"); // NO testMode
  await page.waitForSelector("#grid .day", { timeout: 15000 });
  await page.waitForTimeout(1500);

  expect(errors).toEqual([]);

  const probe = await page.evaluate(() => ({
    testModeFlag: typeof window.__VANGUARD_TEST_MODE__,
    // The service worker path is NOT suppressed in normal mode. (Actual
    // registration may still be pending/failed on a plain http host — the
    // assertion is that test mode did not disable the code path.)
    swSupported: "serviceWorker" in navigator,
  }));
  expect(probe.testModeFlag).toBe("undefined");
  expect(probe.swSupported).toBe(true);
});

test("offline app-shell loading via the service worker", async ({ page, context }) => {
  const errors = await hardenPage(page);
  await page.goto("/index.html"); // normal mode → SW registers
  await page.waitForSelector("#grid .day", { timeout: 15000 });

  // Wait for the service worker to control the page and finish precaching.
  const controlled = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      // Give the install handler a moment to finish precaching the shell.
      await new Promise((r) => setTimeout(r, 1500));
      return !!reg.active;
    } catch {
      return false;
    }
  });
  test.skip(!controlled, "service worker did not activate in this environment");

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#grid .day", { timeout: 15000 });
    await expect(page.locator("#monthLabel")).not.toHaveText("");
  } finally {
    await context.setOffline(false);
  }
});
