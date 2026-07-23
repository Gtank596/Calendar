// Reminder engine tests: deterministic IDs, occurrence resolution, stale
// skipping, dedupe, budget exclusion, and Web Push schedule-row privacy.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, makeReminderEvent } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

beforeEach(() => {
  app.eval(`events = {}; clearIndexedDbEventRangeCache("test reset");`);
  app.window.localStorage.removeItem("myCalendarSentReminders_v1");
});

function seedDay(dateISO, evs) {
  app.eval(`
    events[${JSON.stringify(dateISO)}] = ${JSON.stringify(evs)};
    clearIndexedDbEventRangeCache("seed");
  `);
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("buildReminderId", () => {
  it("is deterministic and versioned", () => {
    expect(w.buildReminderId("m1", "2026-03-10", 600, 15)).toBe("v1|m1|2026-03-10|600|15");
    expect(w.buildReminderId("m1", "2026-03-10", 600, 15)).toBe(
      w.buildReminderId("m1", "2026-03-10", 600, 15)
    );
  });

  it("changes when the event time changes (old reminders can't fire)", () => {
    expect(w.buildReminderId("m1", "2026-03-10", 600, 15)).not.toBe(
      w.buildReminderId("m1", "2026-03-10", 615, 15)
    );
  });
});

describe("collectReminderEntries — occurrence resolution", () => {
  it("collects a reminder entry with the deterministic ID", () => {
    const iso = todayISO();
    seedDay(iso, [makeReminderEvent({ id: "r1", startTime: "10:00 AM" })]);
    const entries = w.collectReminderEntries(Date.now());
    const hit = entries.find((e) => e.masterId === "r1");
    expect(hit).toBeTruthy();
    expect(hit.id).toBe(`v1|r1|${iso}|600|15`);
  });

  it("excludes budget-sourced rows even if they carry a reminder", () => {
    seedDay(todayISO(), [
      makeReminderEvent({ id: "r2", source: "budget", startTime: "10:00 AM" }),
    ]);
    expect(w.collectReminderEntries(Date.now()).some((e) => e.masterId === "r2")).toBe(false);
  });

  it("excludes events without a start time (V1 limitation, documented)", () => {
    seedDay(todayISO(), [makeReminderEvent({ id: "r3", startTime: "" })]);
    expect(w.collectReminderEntries(Date.now()).some((e) => e.masterId === "r3")).toBe(false);
  });

  it("resolves recurring occurrences (daily master started earlier)", () => {
    const startISO = todayISO(-10);
    seedDay(startISO, [
      makeReminderEvent({
        id: "r4",
        startDate: startISO,
        startTime: "9:00 AM",
        recurrence: { freq: "daily" },
      }),
    ]);
    const entries = w.collectReminderEntries(Date.now());
    const hit = entries.find((e) => e.masterId === "r4" && e.occDateISO === todayISO());
    expect(hit).toBeTruthy();
    expect(hit.id).toBe(`v1|r4|${todayISO()}|540|15`);
  });

  it("respects recurrence exceptions (deleted occurrence → no reminder)", () => {
    const startISO = todayISO(-10);
    seedDay(startISO, [
      makeReminderEvent({
        id: "r5",
        startDate: startISO,
        startTime: "9:00 AM",
        recurrence: { freq: "daily", exceptions: [todayISO()] },
      }),
    ]);
    const entries = w.collectReminderEntries(Date.now());
    expect(entries.some((e) => e.masterId === "r5" && e.occDateISO === todayISO())).toBe(false);
  });
});

describe("checkRemindersNow — due filtering, stale skip, dedupe", () => {
  function seedDueNow(id) {
    // Start = now + 10 min, offset 15 → due 5 minutes ago (inside lookback).
    const now = new Date();
    const startMins = now.getHours() * 60 + now.getMinutes() + 10;
    const clock = w.minutesToClockString(Math.min(startMins, 23 * 60 + 45));
    seedDay(todayISO(), [makeReminderEvent({ id, startTime: clock })]);
  }

  it("fires a due reminder exactly once (dedupe via sent map)", async () => {
    seedDueNow("due1");
    await w.checkRemindersNow("test");
    const sent1 = JSON.parse(app.window.localStorage.getItem("myCalendarSentReminders_v1"));
    const keys1 = Object.keys(sent1).filter((k) => k.includes("due1"));
    expect(keys1).toHaveLength(1);

    await w.checkRemindersNow("test again");
    const sent2 = JSON.parse(app.window.localStorage.getItem("myCalendarSentReminders_v1"));
    expect(Object.keys(sent2).filter((k) => k.includes("due1"))).toEqual(keys1);
  });

  it("skips stale reminders outside the 30-minute catch-up window", async () => {
    // Event earlier today, reminder due hours ago → must be skipped, not fired.
    seedDay(todayISO(), [makeReminderEvent({ id: "stale1", startTime: "12:05 AM" })]);
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    if (nowMins < 45) return; // just after midnight the entry wouldn't be stale; skip silently
    await w.checkRemindersNow("test");
    const sent = JSON.parse(app.window.localStorage.getItem("myCalendarSentReminders_v1") || "{}");
    expect(Object.keys(sent).some((k) => k.includes("stale1"))).toBe(false);
  });

  it("prunes sent entries older than 7 days", () => {
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const fresh = Date.now() - 60 * 1000;
    const { map, changed } = w.pruneSentReminderMap({ oldId: old, freshId: fresh }, Date.now());
    expect(changed).toBe(true);
    expect(map.oldId).toBeUndefined();
    expect(map.freshId).toBe(fresh);
  });
});

describe("Web Push schedule rows — privacy shape", () => {
  it("contains scheduling data only — no details, price, or category", () => {
    app.eval(`cloudUser = { id: "u-push", email: "push@example.com" };`);
    const iso = todayISO(1);
    seedDay(iso, [
      makeReminderEvent({
        id: "p1",
        startDate: iso,
        startTime: "10:00 AM",
        details: "PRIVATE NOTES",
        price: 123.45,
      }),
    ]);
    const rows = w.buildReminderScheduleRows();
    const row = rows.find((r) => r.event_id === "p1");
    expect(row).toBeTruthy();
    expect(Object.keys(row).sort()).toEqual(
      [
        "user_id", "event_id", "status", "next_reminder_at", "title",
        "start_date", "start_minutes", "offset_minutes", "timezone",
        "recurrence", "updated_at",
      ].sort()
    );
    expect(JSON.stringify(row)).not.toContain("PRIVATE NOTES");
    expect(JSON.stringify(row)).not.toContain("123.45");
    app.eval(`cloudUser = null;`);
  });
});
