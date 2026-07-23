// REGRESSION: Sync-queue isolation across accounts.
//
// Historical bugs prevented here:
//   * "User A's queued cloud ops replayed under User B after a switch."
//   * "A stale IndexedDB event resurrected after logout."
//   * "Empty local state overwrote valid cloud data on login."
//   * "Deleted events reappeared because a stale known-records index
//      re-upserted them."

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, USER_A, USER_B } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  app.supabaseServer.addUser(USER_A.email, USER_A.password);
  app.supabaseServer.addUser(USER_B.email, USER_B.password);
});
afterAll(() => harness.close());

describe("queued ops never replay under another account", () => {
  it("A's offline queue is cleared by logout and never runs as B", async () => {
    const server = app.supabaseServer;

    // A signs in and queues record ops while the cloud write fails.
    await server.signIn(USER_A.email);
    await app.flush(10);

    server.injectError("calendar_cloud_state", "upsert", { message: "injected outage" }, 99);
    app.eval(`
      events["2026-06-01"] = [${JSON.stringify(makeEvent({ id: "a-queued-1", title: "A queued secret" }))}];
      saveEvents();
    `);
    await app.eval(`enqueueCloudRecordOpsForSlices(["events"], "test")`);
    await app.flush(4);

    const queuedBefore = await w.countQueuedCloudRecordOps();
    expect(queuedBefore).toBeGreaterThan(0);

    // Logout clears the replayable queue.
    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    expect(await w.countQueuedCloudRecordOps()).toBe(0);

    // B signs in; flushing pending sync must upload nothing of A's.
    server.runtime.injectedErrors.length = 0; // outage over
    app.advanceClock(20000);
    const userB = await server.signIn(USER_B.email);
    await app.flush(10);
    await w.tryFlushPendingCloudSync("test");
    await app.flush(4);

    const rows = server.getRows("calendar_cloud_state");
    expect(JSON.stringify(rows)).not.toContain("A queued secret");
    expect(rows.filter((r) => r.user_id === userB.id).every((r) =>
      !JSON.stringify(r).includes("a-queued-1"))).toBe(true);
  }, 30000);

  it("IndexedDB event and syncQueue stores are empty after the logout", async () => {
    const audit = await w.testAccountSwitchSafety();
    // B is still signed in from the previous test — sign out first.
    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    const audit2 = await w.testAccountSwitchSafety();
    expect(audit2.filter((l) => l.startsWith("FAIL"))).toEqual([]);
  }, 30000);
});

describe("cross-account and empty-state safety", () => {
  it("delta pulls cannot cross account boundaries (client + policy)", async () => {
    const server = app.supabaseServer;
    app.advanceClock(20000);
    const userA = await server.signIn(USER_A.email);
    await app.flush(10);
    app.eval(`
      events["2026-06-02"] = [${JSON.stringify(makeEvent({ id: "a-delta-1", title: "A delta row" }))}];
      saveEvents();
    `);
    await w.writeCloudStateNow(["events"]);

    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);

    app.advanceClock(20000);
    await server.signIn(USER_B.email);
    await app.flush(10);

    const rowsSeenByB = await w.readAllCloudRowsForUser();
    expect(JSON.stringify(rowsSeenByB)).not.toContain("A delta row");

    const deltaRows = await w.readCloudRowsForUserSince(0);
    expect(JSON.stringify(deltaRows)).not.toContain("A delta row");
  }, 30000);

  it("an empty local baseline never overwrites valid cloud data", async () => {
    const server = app.supabaseServer;
    // A's cloud rows exist from the previous test. Sign B out, then A in on a
    // cleared-baseline device: the login path must PULL, not push emptiness.
    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);

    const before = server.getRows("calendar_cloud_state")
      .filter((r) => JSON.stringify(r).includes("a-delta-1"));
    expect(before.length).toBeGreaterThan(0);

    app.advanceClock(20000);
    await server.signIn(USER_A.email);
    await app.flush(10);

    const after = server.getRows("calendar_cloud_state")
      .filter((r) => JSON.stringify(r).includes("a-delta-1"));
    expect(after.length).toBe(before.length); // cloud untouched
    expect(app.eval(`JSON.stringify(events)`)).toContain("A delta row"); // and pulled
  }, 30000);
});

describe("tombstones win over stale indexes", () => {
  it("a deleted record does not reappear when ops replay into a payload", () => {
    const ev = makeEvent({ id: "dead-1", title: "Deleted thing" });
    const base = { events: { "2026-06-03": [ev] }, updatedAt: 1000 };

    // Later tombstone op for the same record must remove it.
    const del = w.makeEventCloudOp(ev, "2026-06-03", 2000, true);
    const merged = w.applyCloudRecordOpsToPayload([del], base);
    expect(JSON.stringify(merged.events || {})).not.toContain("dead-1");
  });

  it("re-upserting from a stale known-records index cannot resurrect it", () => {
    const ev = makeEvent({ id: "dead-2", title: "Deleted thing 2" });
    const older = w.makeEventCloudOp(ev, "2026-06-03", 1000, false);
    const tombstone = w.makeEventCloudOp(ev, "2026-06-03", 2000, true);
    // Ops arrive out of order: the newer tombstone must still win.
    const merged = w.mergeCloudRecordOpsIntoPayload([older, tombstone], { updatedAt: 1 });
    expect(JSON.stringify(merged.events || {})).not.toContain("dead-2");
  });
});
