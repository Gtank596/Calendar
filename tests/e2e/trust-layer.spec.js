// Trust Layer V1 in a REAL browser: data safety & recovery UI, safe restore
// with keyboard-accessible confirmation, sync status/history, deduplicated
// remote-change notices, shared attribution + activity, and cross-account
// snapshot/history isolation. All network is locked down (see helpers.js).

import { test, expect } from "@playwright/test";
import { bootApp, quickAdd } from "./helpers.js";

async function installClockSkew(page) {
  await page.evaluate(() => {
    window.__clockSkew = 0;
    const realNow = Date.now.bind(Date);
    Date.now = () => realNow() + window.__clockSkew;
  });
  return (ms) => page.evaluate((m) => { window.__clockSkew += m; }, ms);
}

async function openAccountModal(page) {
  await page.click("#accountBtn");
  await expect(page.locator("#accountModal")).toBeVisible();
  await page.waitForTimeout(400); // async panel renders (snapshot list)
}

test("data safety panel: create a backup, see it listed, safe-restore it without any cloud upload", async ({ page }) => {
  test.setTimeout(120000);
  await bootApp(page);
  const skew = await installClockSkew(page);

  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    await server.signIn("a@example.com");
  });
  await page.waitForTimeout(1000);

  await quickAdd(page, "Original dentist visit tomorrow 10am");
  await expect(page.locator("#grid")).toContainText("Original dentist");
  await page.evaluate(async () => { await window.writeCloudStateNow(["events"]); });

  // ---- Open Data safety & recovery, create a backup -----------------------
  await openAccountModal(page);
  await expect(page.locator("#trustBackupPanel")).toContainText("Data safety");
  await page.click("#trustCreateBackupBtn");
  await expect(page.locator("#trustSnapshotList")).toContainText("Manual backup");

  // ---- Change local data, then restore the backup --------------------------
  await page.evaluate(() => window.closeAccountModal());
  await quickAdd(page, "Newer replacement plan tomorrow 2pm");
  await expect(page.locator("#grid")).toContainText("Newer replacement");
  await page.evaluate(async () => { await window.writeCloudStateNow(["events"]); });
  const cloudBefore = await page.evaluate(() =>
    JSON.stringify(window.__vanguardFakeSupabaseServer.getRows("calendar_cloud_state")));

  await openAccountModal(page);
  const restoreBtn = page.locator("#trustSnapshotList .trustSnapshotRow", { hasText: "Manual backup" }).first().locator("button");
  await restoreBtn.click();

  // Confirmation dialog: visible, focus inside, Escape cancels ONLY the dialog.
  await expect(page.locator("#trustConfirmModal")).toBeVisible();
  await expect(page.locator("#trustConfirmBody")).toContainText("cloud data will NOT be changed");
  const focusedId = await page.evaluate(() => document.activeElement?.id || "");
  expect(focusedId).toBe("trustConfirmOkBtn");
  await page.keyboard.press("Escape");
  await expect(page.locator("#trustConfirmModal")).toBeHidden();
  await expect(page.locator("#accountModal")).toBeVisible(); // account modal survived

  // Confirm for real this time (keyboard: dialog re-opens focused on Confirm).
  await restoreBtn.click();
  await expect(page.locator("#trustConfirmModal")).toBeVisible();
  await page.keyboard.press("Enter"); // activates the focused Confirm button
  await page.waitForTimeout(800);

  // Restored data replaced local state; review banner is up; cloud untouched.
  await expect(page.locator("#trustRestoreReviewBanner")).toBeVisible();
  await page.evaluate(() => window.closeAccountModal());
  await expect(page.locator("#grid")).toContainText("Original dentist");
  await expect(page.locator("#grid")).not.toContainText("Newer replacement");

  await skew(5000);
  await page.waitForTimeout(1500); // give any (wrongly) scheduled flush a chance
  const cloudAfter = await page.evaluate(() =>
    JSON.stringify(window.__vanguardFakeSupabaseServer.getRows("calendar_cloud_state")));
  expect(cloudAfter).toBe(cloudBefore); // NO automatic upload of restored state

  // ---- Deliberate decision: Keep restored copy and Push --------------------
  await openAccountModal(page);
  await page.click("#trustReviewKeepBtn");
  await page.waitForTimeout(800);
  await expect(page.locator("#trustRestoreReviewBanner")).toBeHidden();
  const cloudFinal = await page.evaluate(() =>
    JSON.stringify(window.__vanguardFakeSupabaseServer.getRows("calendar_cloud_state")));
  expect(cloudFinal).toContain("Original dentist");
});

test("sync status + history are visible, truthful, and clearable; remote notices dedupe", async ({ page }) => {
  test.setTimeout(90000);
  await bootApp(page);

  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    await server.signIn("a@example.com");
  });
  await page.waitForTimeout(1000);

  await quickAdd(page, "Sync visibility check tomorrow 11am");
  await page.evaluate(async () => { await window.writeCloudStateNow(["events"]); });

  await openAccountModal(page);
  await expect(page.locator("#trustSyncPanel")).toContainText("Sync status");
  await expect(page.locator("#trustSyncHeadline")).toContainText("a@example.com");
  await expect(page.locator("#trustSyncStatusList")).toContainText("Online");
  await expect(page.locator("#trustSyncStatusList")).toContainText("Signed in as a@example.com");

  // History: the real flush success is listed.
  await page.click("#trustSyncHistoryWrap summary");
  await expect(page.locator("#trustSyncHistoryList")).toContainText("Synced to cloud");

  // Remote-change notice: a burst produces ONE visible toast.
  await page.evaluate(() => {
    window.trustLastRemoteNoticeAt = 0;
    window.noteRemoteCloudChangesApplied(["events"], "delta pull");
    window.noteRemoteCloudChangesApplied(["events"], "delta pull");
    window.noteRemoteCloudChangesApplied(["events"], "delta pull");
  });
  await expect(page.locator("#trustToast")).toHaveClass(/visible/);
  await expect(page.locator("#trustToast")).toContainText("Changes from another device were applied");
  expect(await page.locator("#trustToast").count()).toBe(1);

  // The history recorded each application truthfully.
  await expect(page.locator("#trustSyncHistoryList")).toContainText("Changes from another device applied");

  // Clear history works and leaves an honest empty state.
  await page.click("#trustSyncHistoryClearBtn");
  await expect(page.locator("#trustSyncHistoryList")).toContainText("No sync activity recorded");
});

test("shared attribution + activity feed in the browser", async ({ page }) => {
  test.setTimeout(90000);
  await bootApp(page);

  // Seed: A owns a shared calendar; B (signed in here) is an editor.
  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    server.addUser("b@example.com", "pw");
    const a = server.state.users.find((u) => u.email === "a@example.com");
    const b = server.state.users.find((u) => u.email === "b@example.com");
    const cal = server.makeCalendar({ id: "cal-live", ownerId: a.id, ownerEmail: a.email, name: "Live Team", kind: "shared" });
    server.addMember(cal.id, b, "editor");
    await server.signIn("b@example.com");
  });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => { await window.refreshSharedCalendarV2Core("e2e seed"); });
  await page.waitForTimeout(400);

  // B creates a shared event through the real production path.
  await page.evaluate(async () => {
    await window.createSharedV2EventFromMainForm("cal-live", {
      title: "Grocery run", startDate: "2026-07-28", startTime: "5:00 pm",
      endTime: "6:00 pm", color: "#4a90d9", categoryId: "other", freq: "none",
    });
  });
  await page.waitForTimeout(600);

  // Attribution renders in the shared-event detail modal.
  await page.evaluate(() => {
    const ev = window.getSharedV2EventsForDay("2026-07-28").find((e) => e.title === "Grocery run");
    window.openSharedEventDetails(ev, "2026-07-28");
  });
  await expect(page.locator("#sharedEventModalAttribution")).toBeVisible();
  await expect(page.locator("#sharedEventModalAttribution")).toContainText("Created by you");
  await page.click("#sharedEventModalCloseBtn");

  // The activity feed lists the action with the actor.
  await openAccountModal(page);
  const activityToggle = page.locator(".sharedV2CalCard", { hasText: "Live Team" }).locator(".sharedActivityWrap summary");
  await activityToggle.click();
  await expect(page.locator(".sharedActivityList")).toContainText("You created “Grocery run”");
});

test("cross-account snapshot and history isolation in the browser", async ({ page }) => {
  test.setTimeout(120000);
  await bootApp(page);
  const skew = await installClockSkew(page);

  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    server.addUser("b@example.com", "pw");
    await server.signIn("a@example.com");
  });
  await page.waitForTimeout(1000);

  await quickAdd(page, "A private plan tomorrow 4pm");
  await page.evaluate(async () => { await window.writeCloudStateNow(["events"]); });

  await openAccountModal(page);
  await page.click("#trustCreateBackupBtn");
  await expect(page.locator("#trustSnapshotList")).toContainText("Manual backup");
  await page.evaluate(() => window.closeAccountModal());

  // A → out, B → in.
  await skew(20000);
  await page.evaluate(async () => { await window.logoutCloud(); });
  await page.waitForTimeout(800);
  await skew(20000);
  await page.evaluate(async () => { await window.__vanguardFakeSupabaseServer.signIn("b@example.com"); });
  await page.waitForTimeout(1500);

  await openAccountModal(page);
  // B's snapshot list shows nothing of A's.
  await expect(page.locator("#trustSnapshotList")).not.toContainText("Manual backup");
  await expect(page.locator("#trustSnapshotList")).toContainText("No snapshots");
  // B's sync history contains nothing from A's session.
  await page.click("#trustSyncHistoryWrap summary");
  await expect(page.locator("#trustSyncHistoryList")).not.toContainText("Backup created");

  // And the restore FUNCTION (not just the UI) refuses A's snapshot id.
  const forged = await page.evaluate(async () => {
    const all = await window.readAllSnapshotRows();
    const aSnap = all.find((s) => s.reason === "manual backup");
    if (!aSnap) return "missing";
    try {
      await window.restoreLocalSnapshot(aSnap.id);
      return "restored";
    } catch (err) {
      return String(err.message);
    }
  });
  expect(forged).toMatch(/different identity/i);
});

test("mobile: account modal scrolls its own panels and the confirm dialog stays keyboard-usable", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 375, height: 812 });
  await bootApp(page);

  await page.evaluate(async () => {
    const server = window.__vanguardFakeSupabaseServer;
    server.addUser("a@example.com", "pw");
    await server.signIn("a@example.com");
  });
  await page.waitForTimeout(1000);

  await openAccountModal(page);
  await page.click("#trustCreateBackupBtn");
  await expect(page.locator("#trustSnapshotList")).toContainText("Manual backup");

  const restoreBtn = page.locator("#trustSnapshotList .trustSnapshotRow").first().locator("button");
  await restoreBtn.click();
  await expect(page.locator("#trustConfirmModal")).toBeVisible();

  // Background scroll is locked while the dialog is open.
  const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(bodyOverflow).toBe("hidden");

  // Tab cycles inside the dialog (never escapes to the page behind).
  await page.keyboard.press("Tab");
  const stillInside = await page.evaluate(() =>
    !!document.activeElement?.closest("#trustConfirmModal"));
  expect(stillInside).toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.locator("#trustConfirmModal")).toBeHidden();
  const unlocked = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(unlocked).not.toBe("hidden");
});
