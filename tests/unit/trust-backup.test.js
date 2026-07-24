// UNIT: Trust Layer V1 — snapshot identity metadata, eligibility rules,
// backup envelope creation/validation, filename generation, and the
// restore-review state machine.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, USER_A } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

describe("snapshot owner metadata", () => {
  it("a snapshot saved while signed in carries the user's id, email, format and summary", async () => {
    const server = app.supabaseServer;
    server.addUser(USER_A.email, USER_A.password);
    const user = await server.signIn(USER_A.email);
    await app.flush(10);

    app.eval(`
      events["2026-06-01"] = [
        ${JSON.stringify(makeEvent({ id: "s1", title: "Snap subject" }))},
        ${JSON.stringify(makeEvent({ id: "s2", title: "Priced thing", price: 12.5 }))}
      ];
      saveEvents();
    `);
    await app.flush(4);

    expect(await w.saveLocalSnapshot("manual backup")).toBe(true);
    const rows = await w.readAllSnapshotRows();
    const snap = rows.sort((a, b) => b.id - a.id)[0];

    expect(snap.ownerId).toBe(user.id);
    expect(snap.ownerEmail).toBe(USER_A.email);
    expect(snap.format).toBe(2);
    expect(snap.reason).toBe("manual backup");
    expect(snap.summary.eventCount).toBe(2);
    expect(snap.summary.pricedEventCount).toBe(1);
    // No secrets in the record:
    const json = JSON.stringify(snap);
    expect(json).not.toMatch(/password|token|authorization/i);
  }, 30000);

  it("two snapshots in the same millisecond still get distinct ids", async () => {
    const before = (await w.readAllSnapshotRows()).length;
    await Promise.all([w.saveLocalSnapshot("a"), w.saveLocalSnapshot("b")]);
    const rows = await w.readAllSnapshotRows();
    expect(rows.length).toBe(before + 2);
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  }, 30000);
});

describe("snapshot eligibility rules", () => {
  it("owned / unclaimed / legacy snapshots follow the documented matrix", () => {
    const mine = { ownerId: app.eval("cloudUser.id"), payload: {} };
    const other = { ownerId: "user-somebody_else", payload: {} };
    const unclaimed = { ownerId: "", payload: {} };
    const legacy = { payload: {} }; // pre-Trust-Layer record: no ownerId field

    // Signed in as A:
    expect(w.snapshotEligibleForCurrentIdentity(mine)).toBe(true);
    expect(w.snapshotEligibleForCurrentIdentity(other)).toBe(false);
    expect(w.snapshotEligibleForCurrentIdentity(unclaimed)).toBe(false);
    expect(w.snapshotEligibleForCurrentIdentity(legacy)).toBe(false);
    expect(w.snapshotEligibleForCurrentIdentity(null)).toBe(false);
  });
});

describe("backup envelope", () => {
  it("creates a versioned envelope with checksum and no secret material", () => {
    const envelope = w.buildTrustBackupEnvelope("manual download");
    expect(envelope.format).toBe("vanguard-calendar-backup");
    expect(envelope.formatVersion).toBe(1);
    expect(envelope.appDataVersion).toBe(app.eval("SPLIT_STORAGE_VERSION"));
    expect(envelope.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(envelope.payload && typeof envelope.payload).toBe("object");
    expect(envelope.payloadChecksum).toMatch(/^[0-9a-f]{16}$/);

    const json = JSON.stringify(envelope);
    expect(json).not.toMatch(/password|access_token|refresh_token|authorization|vapid|p256dh/i);
    // No sync log inside the envelope:
    expect(json).not.toContain("myCalendarSyncLog");
  });

  it("round-trips through validation, and detects corruption via checksum", () => {
    const envelope = w.buildTrustBackupEnvelope();
    const good = w.validateTrustBackupEnvelope(JSON.parse(JSON.stringify(envelope)));
    expect(good.ok).toBe(true);
    expect(good.legacy).toBe(false);

    const damaged = JSON.parse(JSON.stringify(envelope));
    damaged.payload.events = { "2026-01-01": [{ id: "injected", title: "tampered" }] };
    const bad = w.validateTrustBackupEnvelope(damaged);
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/integrity|damaged/i);
  });

  it("rejects non-backups and future format versions; accepts legacy bare payloads", () => {
    expect(w.validateTrustBackupEnvelope(null).ok).toBe(false);
    expect(w.validateTrustBackupEnvelope({ hello: "world" }).ok).toBe(false);
    expect(w.validateTrustBackupEnvelope([1, 2, 3]).ok).toBe(false);

    const future = w.buildTrustBackupEnvelope();
    future.formatVersion = 99;
    expect(w.validateTrustBackupEnvelope(future).ok).toBe(false);

    // Legacy: a bare full-save payload (old manual exports).
    const legacy = w.validateTrustBackupEnvelope({
      version: 3, updatedAt: 5, events: { "2026-02-02": [] },
    });
    expect(legacy.ok).toBe(true);
    expect(legacy.legacy).toBe(true);

    // Legacy with corrupt events must be refused.
    expect(w.validateTrustBackupEnvelope({ version: 3, events: "corrupt" }).ok).toBe(false);
  });
});

describe("backup filename", () => {
  it("generates the documented vanguard-calendar-backup-YYYY-MM-DD-HHmm.json shape", () => {
    const name = w.trustBackupFilename(new w.Date(2026, 6, 23, 9, 5));
    expect(name).toBe("vanguard-calendar-backup-2026-07-23-0905.json");
  });
});

describe("snapshot validation before restore", () => {
  it("refuses corrupted payloads without touching current data", () => {
    expect(w.validateSnapshotForRestore(null).ok).toBe(false);
    expect(w.validateSnapshotForRestore({ payload: null }).ok).toBe(false);
    expect(w.validateSnapshotForRestore({ payload: "junk" }).ok).toBe(false);
    expect(w.validateSnapshotForRestore({ payload: { events: "not-a-map" } }).ok).toBe(false);
    expect(w.validateSnapshotForRestore({ payload: { events: {} }, format: 99 }).ok).toBe(false);
    expect(w.validateSnapshotForRestore({ payload: { events: {} }, format: 2 }).ok).toBe(true);
  });
});

describe("restore-review state machine", () => {
  it("enter → active → clear, persisted in an account-scoped localStorage key", () => {
    expect(w.isRestoreReviewActive()).toBe(false);

    w.enterRestoreReviewState({ id: 7, savedAt: "2026-07-01T10:00:00.000Z", reason: "manual backup" }, "snapshot");
    expect(w.isRestoreReviewActive()).toBe(true);

    const st = w.getRestoreReviewState();
    expect(st.snapshotId).toBe(7);
    expect(st.ownerId).toBe(app.eval("cloudUser.id"));
    expect(app.window.localStorage.getItem("myCalendarRestoreReview_v1")).toBeTruthy();

    w.clearRestoreReviewState("test");
    expect(w.isRestoreReviewActive()).toBe(false);
    expect(app.window.localStorage.getItem("myCalendarRestoreReview_v1")).toBe(null);
  });

  it("the review marker key is account-scoped (cleared by section 21)", () => {
    const keys = w.getAccountScopedLocalStorageKeys();
    expect(keys).toContain("myCalendarRestoreReview_v1");
    expect(keys).toContain("myCalendarSyncLog_v1");
  });
});
