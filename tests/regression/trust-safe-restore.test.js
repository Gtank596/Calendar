// REGRESSION: Trust Layer V1 — the safe restore flow.
//
// Invariants protected here:
//   * The current state is snapshotted BEFORE a restore replaces it.
//   * Corrupted snapshots are rejected without destroying current data.
//   * A restore replaces local data but NEVER auto-pushes to the cloud.
//   * Background sync (flush, debounced writes, auto pulls, mirror) is paused
//     while the restore review is active.
//   * Explicit Keep & Push uploads the restored state.
//   * Explicit Discard & Pull restores the cloud-authoritative state.
//   * A reload preserves the review state.
//   * Logout / account switching clears the review marker.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, USER_A } from "../fixtures/index.js";

let harness, app, w, server, userA;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  server = app.supabaseServer;
  server.addUser(USER_A.email, USER_A.password);
  userA = await server.signIn(USER_A.email);
  await app.flush(10);
});
afterAll(() => harness.close());

function eventTitles() {
  return app.eval(`JSON.stringify(Object.values(events).flat().map(e => e.title))`);
}

describe("safe restore end-to-end (single device, real production paths)", () => {
  it("restore snapshots first, pauses sync, and resolves via Keep & Push", async () => {
    // ---- Baseline: one event, synced to cloud -----------------------------
    app.eval(`
      events["2026-05-10"] = [${JSON.stringify(makeEvent({ id: "keep-1", title: "Original plan" }))}];
      saveEvents();
    `);
    expect(await w.writeCloudStateNow(["events"])).toBe(true);
    expect(await w.saveLocalSnapshot("manual backup")).toBe(true);
    const snapshotId = (await w.listLocalSnapshots())[0].id;

    // ---- The user then changes their mind locally -------------------------
    app.eval(`
      events["2026-05-10"] = [${JSON.stringify(makeEvent({ id: "new-1", title: "Newer local edit" }))}];
      saveEvents();
    `);
    expect(await w.writeCloudStateNow(["events"])).toBe(true);
    const cloudRowsBefore = JSON.stringify(server.getRows("calendar_cloud_state"));

    const snapCountBefore = (await w.readAllSnapshotRows()).length;

    // ---- Restore the older snapshot ---------------------------------------
    await w.restoreLocalSnapshot(snapshotId, { source: "test" });

    // 1. Pre-restore safety snapshot was written:
    const snapsAfter = await w.readAllSnapshotRows();
    expect(snapsAfter.length).toBe(snapCountBefore + 1);
    expect(snapsAfter.some((s) => s.reason === "before user restore")).toBe(true);

    // 2. Local data was replaced through the normal pipeline:
    expect(eventTitles()).toContain("Original plan");
    expect(eventTitles()).not.toContain("Newer local edit");

    // 3. Review state is active; the cloud was NOT touched:
    expect(w.isRestoreReviewActive()).toBe(true);
    expect(JSON.stringify(server.getRows("calendar_cloud_state"))).toBe(cloudRowsBefore);

    // 4. Background sync paths are all paused:
    expect(await w.tryFlushPendingCloudSync("test")).toBe(false);
    expect(await w.writeCloudStateNow(["events"])).toBe(false);
    await w.pullCloudIfNewer({ preferDelta: true }); // auto pull → no-op
    expect(eventTitles()).toContain("Original plan"); // still the restored copy
    expect(JSON.stringify(server.getRows("calendar_cloud_state"))).toBe(cloudRowsBefore);

    // Debounced writes don't schedule a flush during review:
    app.eval(`cloudWriteDebounced(["events"])`);
    await new Promise((r) => setTimeout(r, 1200));
    await app.flush(6);
    expect(JSON.stringify(server.getRows("calendar_cloud_state"))).toBe(cloudRowsBefore);

    // ---- Explicit decision: Keep restored copy and Push --------------------
    expect(await w.resolveRestoreReviewKeepPush()).toBe(true);
    await app.flush(6);
    expect(w.isRestoreReviewActive()).toBe(false);
    expect(JSON.stringify(server.getRows("calendar_cloud_state"))).toContain("Original plan");
  }, 60000);

  it("Discard & Pull returns to the cloud-authoritative state", async () => {
    // Cloud currently holds "Original plan" (from the previous test).
    // Make a local snapshot of a DIFFERENT state and restore it.
    app.eval(`
      events["2026-05-11"] = [${JSON.stringify(makeEvent({ id: "tmp-1", title: "Experimental restore" }))}];
      saveEvents();
    `);
    await w.saveLocalSnapshot("manual backup");
    const snapId = (await w.listLocalSnapshots())[0].id;

    // Sync the CURRENT (experimental) state up, then mutate + restore.
    expect(await w.writeCloudStateNow(["events"])).toBe(true);
    app.eval(`
      delete events["2026-05-11"];
      saveEvents();
    `);
    await w.restoreLocalSnapshot(snapId, { source: "test" });
    expect(w.isRestoreReviewActive()).toBe(true);
    expect(eventTitles()).toContain("Experimental restore");

    // Discard & Pull: cloud wins again.
    expect(await w.resolveRestoreReviewDiscardPull()).toBe(true);
    await app.flush(8);
    expect(w.isRestoreReviewActive()).toBe(false);
    expect(eventTitles()).toContain("Experimental restore"); // cloud also had it
    // A safety snapshot of the discarded state was saved first:
    const snaps = await w.readAllSnapshotRows();
    expect(snaps.some((s) => s.reason === "before discarding restored copy")).toBe(true);
  }, 60000);

  it("a corrupted snapshot is rejected without destroying current state", async () => {
    // Seed a corrupt record owned by the current user.
    await app.eval(`(async () => {
      const db = await openSnapshotDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
        tx.objectStore(SNAPSHOT_STORE).put({
          id: 777777,
          reason: "corrupt",
          savedAt: "2026-06-01T00:00:00.000Z",
          ownerId: cloudUser.id,
          payload: { events: "THIS IS NOT AN EVENTS MAP" }
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    })()`);

    const before = eventTitles();
    await expect(w.restoreLocalSnapshot(777777)).rejects.toThrow(/not valid|corrupted/i);
    expect(eventTitles()).toBe(before);           // data untouched
    expect(w.isRestoreReviewActive()).toBe(false); // no review entered
  }, 30000);

  it("a reload preserves the restore-review state", async () => {
    await w.saveLocalSnapshot("manual backup");
    const snapId = (await w.listLocalSnapshots())[0].id;
    await w.restoreLocalSnapshot(snapId, { source: "test" });
    expect(w.isRestoreReviewActive()).toBe(true);

    app = await harness.reload();
    w = app.window;
    server = app.supabaseServer;
    await app.flush(10);

    expect(w.isRestoreReviewActive()).toBe(true);
    expect(await w.tryFlushPendingCloudSync("post reload")).toBe(false); // still paused
  }, 60000);

  it("logout clears the review marker (account-scoped key)", async () => {
    expect(w.isRestoreReviewActive()).toBe(true); // carried over from previous test
    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    expect(app.window.localStorage.getItem("myCalendarRestoreReview_v1")).toBe(null);
    expect(w.isRestoreReviewActive()).toBe(false);
  }, 30000);
});
