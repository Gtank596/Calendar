// REGRESSION: Trust Layer V1 — cross-account snapshot privacy.
//
// Invariants protected here:
//   * User B can never list, inspect, or restore User A's snapshots.
//   * The restore FUNCTION enforces eligibility (a forged snapshot id passed
//     straight to restoreLocalSnapshot is rejected — hiding buttons is not
//     the security boundary).
//   * User A sees their snapshots again after returning.
//   * Legacy snapshots (no ownerId) never auto-appear for a signed-in user.
//   * Unclaimed offline snapshots are visible only in the unclaimed context.
//   * Migration deletes nothing: every identity's snapshots survive in the DB.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, USER_A, USER_B } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

async function settle() { await app.flush(10); }

describe("A→B snapshot isolation drill", () => {
  it("runs the full cross-account snapshot privacy scenario", async () => {
    const server = app.supabaseServer;
    server.addUser(USER_A.email, USER_A.password);
    server.addUser(USER_B.email, USER_B.password);

    // ---- A signs in, makes data, creates a snapshot -----------------------
    const userA = await server.signIn(USER_A.email);
    await settle();
    app.eval(`
      events["2026-04-01"] = [${JSON.stringify(makeEvent({ id: "a-1", title: "A secret plan" }))}];
      saveEvents();
    `);
    await settle();
    expect(await w.saveLocalSnapshot("manual backup")).toBe(true);

    const aList = await w.listLocalSnapshots();
    expect(aList.length).toBeGreaterThan(0);
    const aSnapId = aList[0].id;
    expect(aList[0].ownerId).toBe(userA.id);

    // ---- A logs out (account-scoped clear runs, snapshot DB survives) -----
    app.advanceClock(20000);
    await w.logoutCloud();
    await settle();

    // Signed out (unclaimed context): A's owned snapshots are NOT eligible.
    const signedOutList = await w.listLocalSnapshots();
    expect(signedOutList.every((s) => s.ownerId !== userA.id)).toBe(true);

    // ---- B signs in: cannot see or restore anything of A ------------------
    app.advanceClock(20000);
    const userB = await server.signIn(USER_B.email);
    await settle();

    const bList = await w.listLocalSnapshots();
    expect(bList.every((s) => s.ownerId === userB.id)).toBe(true);
    expect(JSON.stringify(bList)).not.toContain(String(aSnapId));

    // Forged id straight into the restore function → rejected, data untouched.
    await expect(w.restoreLocalSnapshot(aSnapId)).rejects.toThrow(/different identity/i);
    expect(app.eval("JSON.stringify(events)")).not.toContain("A secret plan");
    expect(w.isRestoreReviewActive()).toBe(false); // nothing was restored

    // B's own snapshots work normally.
    expect(await w.saveLocalSnapshot("manual backup")).toBe(true);
    const bList2 = await w.listLocalSnapshots();
    expect(bList2.length).toBeGreaterThan(0);
    expect(bList2.every((s) => s.ownerId === userB.id)).toBe(true);

    // ---- A returns: their snapshot is visible and restorable again --------
    app.advanceClock(20000);
    await w.logoutCloud();
    await settle();
    app.advanceClock(20000);
    await server.signIn(USER_A.email);
    await settle();

    const aListAgain = await w.listLocalSnapshots();
    expect(aListAgain.some((s) => s.id === aSnapId)).toBe(true);
    expect(aListAgain.every((s) => s.ownerId === userA.id)).toBe(true);

    // Nothing was deleted along the way: the raw DB still holds every
    // identity's snapshots (recovery property preserved).
    const raw = await w.readAllSnapshotRows();
    expect(raw.some((s) => s.ownerId === userA.id)).toBe(true);
    expect(raw.some((s) => s.ownerId === userB.id)).toBe(true);
  }, 60000);
});

describe("legacy and unclaimed snapshot eligibility", () => {
  it("legacy snapshots never auto-appear for a signed-in user but survive untouched", async () => {
    // Seed a pre-Trust-Layer record (no ownerId field at all).
    await app.eval(`(async () => {
      const db = await openSnapshotDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
        tx.objectStore(SNAPSHOT_STORE).put({
          id: 424242,
          reason: "legacy snapshot",
          savedAt: "2026-01-01T00:00:00.000Z",
          payload: buildFullSavePayload(getLocalPayload())
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    })()`);

    // Signed in (User A from the drill above): legacy is hidden and
    // non-restorable through the normal path...
    const list = await w.listLocalSnapshots();
    expect(list.some((s) => s.id === 424242)).toBe(false);
    await expect(w.restoreLocalSnapshot(424242)).rejects.toThrow(/different identity/i);

    // ...but the advanced console recovery path still reaches it.
    expect((await w.listLocalSnapshots({ all: true })).some((s) => s.id === 424242)).toBe(true);

    // And it was not deleted by any of this.
    const raw = await w.readAllSnapshotRows();
    expect(raw.some((s) => s.id === 424242)).toBe(true);
  }, 30000);

  it("unclaimed offline snapshots are eligible only while unclaimed", async () => {
    // Sign out → unclaimed context.
    app.advanceClock(20000);
    await w.logoutCloud();
    await settle();

    expect(app.eval("trustCurrentIdentity()")).toBe("");
    expect(await w.saveLocalSnapshot("manual backup")).toBe(true);

    const list = await w.listLocalSnapshots();
    const unclaimed = list.filter((s) => s.ownerId === "");
    expect(unclaimed.length).toBeGreaterThan(0);
    // Legacy records are also treated as unclaimed-context items:
    expect(list.some((s) => s.id === 424242)).toBe(true);
    // And no owned snapshots leak into the unclaimed view:
    expect(list.every((s) => s.ownerId === "" || s.legacy)).toBe(true);
  }, 30000);
});
