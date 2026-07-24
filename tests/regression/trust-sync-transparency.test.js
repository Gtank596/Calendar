// REGRESSION: Trust Layer V1 — sync transparency invariants.
//
//   * Successful and failed cloud operations create truthful log entries.
//   * The log NEVER contains private payloads (titles, notes, prices).
//   * The log is bounded and account-scoped (B cannot read A's history).
//   * "Changes applied" entries appear only when remote data was actually
//     applied — a poll that found nothing logs nothing.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, USER_A, USER_B } from "../fixtures/index.js";

let harness, app, w, server;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  server = app.supabaseServer;
  server.addUser(USER_A.email, USER_A.password);
  server.addUser(USER_B.email, USER_B.password);
});
afterAll(() => harness.close());

function logJson() {
  return JSON.stringify(w.getTrustSyncLog());
}

describe("truthful success / failure entries", () => {
  it("a real flush success and a real flush failure both land in the history", async () => {
    await server.signIn(USER_A.email);
    await app.flush(10);
    w.clearTrustSyncLog();

    app.eval(`
      events["2026-06-10"] = [${JSON.stringify(makeEvent({ id: "t-1", title: "Ultra Secret Party", details: "surprise for Sam", price: 123.45 }))}];
      saveEvents();
    `);
    expect(await w.writeCloudStateNow(["events"])).toBe(true);

    let types = w.getTrustSyncLog().map((e) => e.type);
    expect(types).toContain("local-change-queued");
    expect(types).toContain("sync-flush-succeeded");
    const success = w.getTrustSyncLog().find((e) => e.type === "sync-flush-succeeded");
    expect(success.status).toBe("ok");
    expect(success.counts.rows).toBeGreaterThan(0);

    // Injected server failure → truthful error entry, marked pending.
    server.injectError("calendar_cloud_state", "upsert", { message: "boom from server" }, 1);
    app.eval(`
      events["2026-06-11"] = [${JSON.stringify(makeEvent({ id: "t-2", title: "Second thing" }))}];
      saveEvents();
    `);
    expect(await w.writeCloudStateNow(["events"])).toBe(false);

    const failure = w.getTrustSyncLog().find((e) => e.type === "sync-flush-failed");
    expect(failure).toBeTruthy();
    expect(failure.status).toBe("error");
    expect(failure.detail).toContain("boom from server");
  }, 60000);

  it("no private payload ever reaches the log", () => {
    const json = logJson();
    expect(json).not.toContain("Ultra Secret Party");
    expect(json).not.toContain("surprise for Sam");
    expect(json).not.toContain("123.45");
    expect(json).not.toContain("Second thing");
  });
});

describe("no phantom applied-changes entries", () => {
  it("a delta poll that applies nothing logs no cloud-changes-applied entry", async () => {
    w.clearTrustSyncLog();
    // Local state is already in sync with the cloud (previous test pushed it).
    await w.pullCloudIfNewer({ preferDelta: true });
    await app.flush(4);
    const types = w.getTrustSyncLog().map((e) => e.type);
    expect(types).not.toContain("cloud-changes-applied");

    // And no toast either:
    const toast = app.window.document.getElementById("trustToast");
    expect(toast ? toast.classList.contains("visible") : false).toBe(false);
  }, 30000);
});

describe("bounded, account-scoped history", () => {
  it("the stored log never exceeds 50 entries even under a burst", () => {
    for (let i = 0; i < 120; i++) {
      w.logTrustSyncEvent("came-online", { status: "ok", reason: "burst " + i });
    }
    expect(w.getTrustSyncLog().length).toBe(50);
    const raw = app.window.localStorage.getItem("myCalendarSyncLog_v1");
    expect(JSON.parse(raw).length).toBeLessThanOrEqual(50);
  });

  it("User B never sees User A's sync history", async () => {
    // A's history exists now. Log a recognizable marker for A.
    w.logTrustSyncEvent("manual-push", { status: "ok", reason: "a-marker-entry" });
    expect(logJson()).toContain("a-marker-entry");

    // A logs out, B signs in.
    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    app.advanceClock(20000);
    await server.signIn(USER_B.email);
    await app.flush(10);

    const bJson = logJson();
    expect(bJson).not.toContain("a-marker-entry");
    expect(bJson).not.toContain("boom from server");
    // B's fresh history starts with the honest device-level clear entry.
    const types = w.getTrustSyncLog().map((e) => e.type);
    expect(types).toContain("account-clear");
  }, 60000);
});
