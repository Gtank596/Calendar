// Budget transaction creation, personal/shared isolation, and IndexedDB
// persistence across a real page reload.

import { test, expect } from "@playwright/test";
import { bootApp, quickAdd } from "./helpers.js";

test("budget transaction creation shows in the transaction list", async ({ page }) => {
  await bootApp(page);
  await page.click("#budgetSectionBtn");

  // The transaction form lives in a drawer that starts closed.
  await page.click("#budgetTxDrawerOpenBtn");
  await expect(page.locator("#budgetTxTitle")).toBeVisible();

  await page.fill("#budgetTxTitle", "Test groceries run");
  await page.fill("#budgetTxAmount", "42.50");
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await page.fill("#budgetTxDate", iso);
  await page.click("#budgetTxAddBtn");

  await expect(page.locator("#budgetTransactionList")).toContainText("Test groceries run");
  // The amount renders as an <input value="42.50"> (inline-editable price).
  await expect(
    page.locator("#budgetTransactionList .budgetTxPriceInput").first()
  ).toHaveValue("42.50");
});

test("events persist across a full page reload (IndexedDB/localStorage)", async ({ page }) => {
  await bootApp(page);
  await quickAdd(page, "Persistent plumber tomorrow 9am");
  await expect(page.locator("#grid")).toContainText("Persistent plumber");

  await page.reload();
  await page.waitForSelector("#grid .day", { timeout: 15000 });
  await expect(page.locator("#grid")).toContainText("Persistent plumber");
});

test("personal vs shared isolation: a shared event renders but never enters personal storage or budget", async ({ page }) => {
  await bootApp(page);

  // Build a shared world on the in-page fake backend and sign in as the viewer.
  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    const owner = server.addUser("owner@example.com", "pw");
    const viewer = server.addUser("viewer@example.com", "pw");
    const cal = server.makeCalendar({ id: "cal-e2e", ownerId: owner.id, ownerEmail: owner.email, kind: "shared", name: "E2E Team" });
    server.addMember(cal.id, viewer, "viewer");
    server.makeSharedEvent({
      id: "sev-e2e", calendarId: cal.id, title: "Shared standup E2E",
      startDate: new Date().toISOString().slice(0, 10),
    });
    await server.signIn("viewer@example.com");
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.refreshSharedCalendarV2 ? window.refreshSharedCalendarV2() : window.refreshSharedCalendarV2Core?.("e2e"));
  await page.waitForTimeout(800);

  // Visible in the calendar overlay:
  await expect(page.locator("#grid")).toContainText("Shared standup E2E");

  // But absent from every personal store:
  const leaks = await page.evaluate(async () => {
    const out = {};
    out.personalMap = JSON.stringify(window.events || {}).includes("Shared standup E2E");
    out.localStorage = (localStorage.getItem("myCalendarEvents_v1") || "").includes("Shared standup E2E");
    const db = await window.openCalendarIndexedDb();
    const rows = await new Promise((resolve) => {
      const tx = db.transaction(["events", "budgetTransactions"], "readonly");
      const all = [];
      const r1 = tx.objectStore("events").getAll();
      r1.onsuccess = () => { all.push(...(r1.result || [])); };
      const r2 = tx.objectStore("budgetTransactions").getAll();
      r2.onsuccess = () => { all.push(...(r2.result || [])); resolve(all); };
      tx.onerror = () => resolve(all);
    });
    out.indexedDb = JSON.stringify(rows).includes("Shared standup E2E");
    return out;
  });
  expect(leaks).toEqual({ personalMap: false, localStorage: false, indexedDb: false });
});
