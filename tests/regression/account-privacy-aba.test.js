// REGRESSION: Account privacy and A→B→A switching.
//
// Historical bugs prevented here:
//   * "Logout left the previous account's events visible on the device."
//   * "User B could see or replay User A's local data after a switch."
//   * "A→B→A required a manual Pull before A's events reappeared."
//
// The whole drill runs through the REAL production functions
// (handleAuthUserChange / logoutCloud / clearAccountScopedLocalState) with
// the fake Supabase cloud, on one simulated device.

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

function eventCount() {
  return app.eval(
    `Object.values(events || {}).reduce((n,l)=>n+(Array.isArray(l)?l.length:0),0)`
  );
}

async function settle() {
  await app.flush(10);
}

describe("A→B→A switching drill (single long scenario)", () => {
  it("runs the full sequence with every privacy invariant holding", async () => {
    const server = app.supabaseServer;

    // ---- 1. User A signs in and has private events and budget data --------
    server.addUser(USER_A.email, USER_A.password);
    server.addUser(USER_B.email, USER_B.password);
    const userA = await server.signIn(USER_A.email);
    await settle();
    expect(app.eval("cloudUser && cloudUser.email")).toBe(USER_A.email);

    // Create A's private data through the app's own pipeline.
    const evA = makeEvent({ id: "a-private-1", title: "A private dentist", price: 50 });
    app.eval(`
      events["2026-03-10"] = [${JSON.stringify(evA)}];
      saveEvents(); // real save pipeline: slices, meta, cloud-pending
    `);
    const wrote = await w.writeCloudStateNow(["events"]);
    expect(wrote).toBe(true);

    const cloudRowsA = server.getRows("calendar_cloud_state");
    expect(cloudRowsA.length).toBeGreaterThan(0);
    expect(cloudRowsA.every((r) => r.user_id === userA.id)).toBe(true);
    expect(app.eval("getLocalDataOwner()")).toBe(userA.id);

    // ---- 2-5. A signs out: local view must be scrubbed ---------------------
    app.advanceClock(20000);
    await w.logoutCloud();
    await settle();

    expect(eventCount()).toBe(0);                                   // in-memory cleared
    expect(app.eval("getLocalDataOwner()")).toBe("");               // owner claim gone
    expect(app.window.localStorage.getItem("myCalendarCloudPending_v1")).toBe(null);

    const audit = await w.testAccountSwitchSafety();
    const failures = audit.filter((line) => line.startsWith("FAIL"));
    expect(failures, `audit failures:\n${failures.join("\n")}`).toEqual([]);

    // ---- 6-7. User B signs in: sees nothing of A ---------------------------
    app.advanceClock(20000);
    const userB = await server.signIn(USER_B.email);
    await settle();

    expect(app.eval("cloudUser && cloudUser.email")).toBe(USER_B.email);
    expect(eventCount()).toBe(0);                                   // B sees no A data
    expect(app.eval("getLocalDataOwner()")).toBe(userB.id);
    expect(app.eval("lastLoginPullMode")).toMatch(/full-pull/);

    // B's own writes go only under B's user id.
    app.eval(`
      events["2026-03-11"] = [${JSON.stringify(makeEvent({ id: "b-private-1", title: "B thing" }))}];
      saveEvents();
    `);
    expect(await w.writeCloudStateNow(["events"])).toBe(true);
    const rowsAfterB = server.getRows("calendar_cloud_state");
    expect(rowsAfterB.some((r) => r.user_id === userB.id)).toBe(true);
    // A's rows are untouched by B's session:
    const aRows = rowsAfterB.filter((r) => r.user_id === userA.id);
    expect(aRows.length).toBe(cloudRowsA.length);

    // ---- 8. B signs out ----------------------------------------------------
    app.advanceClock(20000);
    await w.logoutCloud();
    await settle();
    expect(eventCount()).toBe(0);

    // ---- 9-11. A signs back in: full pull, events return, NO manual Pull ---
    app.advanceClock(20000);
    await server.signIn(USER_A.email);
    await settle();

    expect(app.eval("lastLoginPullMode")).toBe("cleared-baseline-full-pull");
    expect(app.eval("getLocalDataOwner()")).toBe(userA.id);
    const restored = app.eval(`JSON.stringify(events["2026-03-10"] || [])`);
    expect(restored).toContain("A private dentist");
    expect(eventCount()).toBeGreaterThan(0);
    // And nothing of B's leaked into A's restored view:
    expect(app.eval(`JSON.stringify(events)`)).not.toContain("B thing");

    // Post-login audit must also fully pass.
    const audit2 = await w.testAccountSwitchSafety();
    expect(audit2.filter((l) => l.startsWith("FAIL"))).toEqual([]);
  }, 60000);
});

describe("true offline-first adoption (pre-first-login data)", () => {
  it("data created before ANY login is adopted by the first account", async () => {
    // Fresh device: nothing was ever cleared, no owner, no baseline marker.
    const freshHarness = new AppHarness();
    const freshApp = await freshHarness.boot();
    try {
      const server = freshApp.supabaseServer;
      server.addUser(USER_A.email, USER_A.password);

      freshApp.eval(`
        events["2026-05-01"] = [${JSON.stringify(makeEvent({ id: "offline-1", title: "Made offline" }))}];
        saveEvents();
      `);
      await freshApp.flush(4);

      await server.signIn(USER_A.email);
      await freshApp.flush(10);

      // Adoption path: local data kept, owned by the first account.
      expect(freshApp.eval("lastLoginPullMode")).toBe("adopted");
      expect(freshApp.eval(`JSON.stringify(events["2026-05-01"] || [])`)).toContain("Made offline");
      expect(freshApp.eval("getLocalDataOwner()")).toBe("user-alice_example_com");
    } finally {
      freshHarness.close();
    }
  }, 30000);
});
