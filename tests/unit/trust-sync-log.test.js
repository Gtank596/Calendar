// UNIT: Trust Layer V1 — structured sync log creation, redaction, retention,
// merge behavior, and remote-change notice deduplication.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

beforeEach(() => {
  w.clearTrustSyncLog();
});

describe("structured sync-event creation", () => {
  it("entries carry type, timestamp, status, safe reason and whitelisted counts", () => {
    const entry = w.logTrustSyncEvent("sync-flush-succeeded", {
      status: "ok",
      reason: "debounced write",
      counts: { slices: 2, rows: 7, bogus: 99, password: "hunter2" },
    });

    expect(entry.type).toBe("sync-flush-succeeded");
    expect(entry.status).toBe("ok");
    expect(entry.reason).toBe("debounced write");
    expect(entry.at).toBeGreaterThan(0);
    expect(entry.counts).toEqual({ slices: 2, rows: 7 }); // non-whitelisted keys dropped

    const stored = w.getTrustSyncLog();
    expect(stored[0].type).toBe("sync-flush-succeeded");
    expect(JSON.stringify(stored)).not.toContain("hunter2");
  });

  it("unknown statuses fall back to info; every used type has a display label", () => {
    const entry = w.logTrustSyncEvent("manual-push", { status: "🔥" });
    expect(entry.status).toBe("info");

    const labels = app.eval("TRUST_SYNC_EVENT_LABELS");
    for (const type of [
      "local-change-queued", "sync-flush-succeeded", "sync-flush-failed",
      "sync-paused-conflict", "cloud-changes-applied", "manual-pull", "manual-push",
      "went-offline", "came-online", "account-clear", "account-switch",
      "restore-review-entered", "restore-kept-pushed", "restore-discarded-pulled",
      "backup-created", "backup-downloaded", "backup-imported",
      "realtime-connected", "realtime-reconnecting", "realtime-failed",
    ]) {
      expect(labels[type], `missing label for ${type}`).toBeTruthy();
    }
  });
});

describe("sync-log redaction", () => {
  it("truncates long text, strips newlines, and redacts token-shaped blobs", () => {
    const noisy = "failed: " + "x".repeat(500) + "\nBearer abcdefghijklmnopqrstuvwxyz0123456789";
    const entry = w.logTrustSyncEvent("sync-flush-failed", { status: "error", detail: noisy });
    expect(entry.detail.length).toBeLessThanOrEqual(140);
    expect(entry.detail).not.toContain("\n");

    const jwtish = "error eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature happened";
    const entry2 = w.logTrustSyncEvent("sync-flush-failed", { status: "error", detail: jwtish });
    expect(entry2.detail).toContain("[redacted]");
    expect(entry2.detail).not.toContain("eyJhbGci");
  });
});

describe("sync-log retention", () => {
  it("never grows beyond the 50-entry cap", () => {
    for (let i = 0; i < 80; i++) {
      w.logTrustSyncEvent("came-online", { status: "ok", reason: "r" + i });
    }
    const log = w.getTrustSyncLog();
    expect(log.length).toBe(50);
    // Newest first:
    expect(log[0].reason).toBe("r79");
  });

  it("rapid consecutive local-change-queued entries merge into one", () => {
    w.logTrustSyncEvent("local-change-queued", { counts: { slices: 1 } });
    w.logTrustSyncEvent("local-change-queued", { counts: { slices: 2 } });
    w.logTrustSyncEvent("local-change-queued", { counts: { slices: 3 } });
    const log = w.getTrustSyncLog();
    expect(log.filter((e) => e.type === "local-change-queued").length).toBe(1);
    expect(log[0].counts.slices).toBe(3); // latest counts win
  });
});

describe("remote-change notice deduplication", () => {
  it("a burst of applied-pull notifications produces one visible toast", () => {
    app.eval("trustLastRemoteNoticeAt = 0");
    w.noteRemoteCloudChangesApplied(["events"], "delta pull");
    w.noteRemoteCloudChangesApplied(["events"], "delta pull");
    w.noteRemoteCloudChangesApplied(["settings"], "delta pull");

    const toast = app.window.document.getElementById("trustToast");
    expect(toast).toBeTruthy();
    expect(toast.classList.contains("visible")).toBe(true);
    expect(toast.textContent).toMatch(/changes from another device were applied/i);

    // All three still land in the log (history is complete; the TOAST is
    // what gets deduplicated).
    const applied = w.getTrustSyncLog().filter((e) => e.type === "cloud-changes-applied");
    expect(applied.length).toBe(3);

    // Debounce window is respected:
    expect(app.eval("Date.now() - trustLastRemoteNoticeAt")).toBeLessThan(8000);
  });

  it("manual pulls never raise the another-device toast", () => {
    app.eval("trustLastRemoteNoticeAt = 0");
    const toast = app.window.document.getElementById("trustToast");
    if (toast) toast.classList.remove("visible");

    w.noteRemoteCloudChangesApplied(["events"], "manual pull");
    const after = app.window.document.getElementById("trustToast");
    expect(after ? after.classList.contains("visible") : false).toBe(false);
    // ...but the truthful history entry still exists.
    expect(w.getTrustSyncLog()[0].type).toBe("cloud-changes-applied");
  });
});
