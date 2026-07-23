// Recurrence engine tests against the real recurrenceMatches() and
// getComputedEventsForDay() from script.js.
//
// Fixed reference dates (all in 2026):
//   2026-03-02 = Monday, 2026-03-08 = Sunday, 2026-03-09 = Monday.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeRecurringEvent } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

describe("recurrenceMatches — frequencies", () => {
  it("no recurrence never matches", () => {
    const ev = makeRecurringEvent({ recurrence: { freq: "none" } });
    expect(w.recurrenceMatches(ev, "2026-03-09")).toBe(false);
  });

  it("daily matches every day from the start date forward", () => {
    const ev = makeRecurringEvent({ startDate: "2026-03-02", recurrence: { freq: "daily" } });
    expect(w.recurrenceMatches(ev, "2026-03-02")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-03-03")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-12-25")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-03-01")).toBe(false); // before start
  });

  it("weekly matches the same weekday only", () => {
    const ev = makeRecurringEvent({ startDate: "2026-03-02", recurrence: { freq: "weekly" } });
    expect(w.recurrenceMatches(ev, "2026-03-09")).toBe(true);  // next Monday
    expect(w.recurrenceMatches(ev, "2026-03-16")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-03-10")).toBe(false); // Tuesday
  });

  it("weekly with interval 2 skips alternate weeks", () => {
    const ev = makeRecurringEvent({
      startDate: "2026-03-02",
      recurrence: { freq: "weekly", interval: 2 },
    });
    expect(w.recurrenceMatches(ev, "2026-03-09")).toBe(false); // week 1
    expect(w.recurrenceMatches(ev, "2026-03-16")).toBe(true);  // week 2
    expect(w.recurrenceMatches(ev, "2026-03-30")).toBe(true);  // week 4
  });

  it("weeklyDays matches only the selected weekdays", () => {
    // Mon(1) + Wed(3)
    const ev = makeRecurringEvent({
      startDate: "2026-03-02",
      recurrence: { freq: "weeklyDays", days: [1, 3] },
    });
    expect(w.recurrenceMatches(ev, "2026-03-04")).toBe(true);  // Wed
    expect(w.recurrenceMatches(ev, "2026-03-09")).toBe(true);  // Mon
    expect(w.recurrenceMatches(ev, "2026-03-05")).toBe(false); // Thu
  });

  it("monthly matches the same day-of-month", () => {
    const ev = makeRecurringEvent({ startDate: "2026-01-15", recurrence: { freq: "monthly" } });
    expect(w.recurrenceMatches(ev, "2026-02-15")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-03-15")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-02-14")).toBe(false);
  });

  it("yearly matches the same month + day across years", () => {
    const ev = makeRecurringEvent({ startDate: "2026-07-04", recurrence: { freq: "yearly" } });
    expect(w.recurrenceMatches(ev, "2027-07-04")).toBe(true);
    expect(w.recurrenceMatches(ev, "2027-07-05")).toBe(false);
    expect(w.recurrenceMatches(ev, "2027-08-04")).toBe(false);
  });

  it("until date is an inclusive upper bound", () => {
    const ev = makeRecurringEvent({
      startDate: "2026-03-02",
      recurrence: { freq: "daily", until: "2026-03-10" },
    });
    expect(w.recurrenceMatches(ev, "2026-03-10")).toBe(true);
    expect(w.recurrenceMatches(ev, "2026-03-11")).toBe(false);
  });

  it("never matches before the series start", () => {
    const ev = makeRecurringEvent({ startDate: "2026-03-02", recurrence: { freq: "daily" } });
    expect(w.recurrenceMatches(ev, "2025-12-31")).toBe(false);
  });
});

describe("getComputedEventsForDay — occurrence expansion", () => {
  beforeEach(() => {
    // Reset the personal events map inside the app realm.
    app.eval(`events = {}; clearIndexedDbEventRangeCache("test reset");`);
  });

  function seedMaster(master) {
    app.eval(`
      events[${JSON.stringify(master.startDate)}] = [${JSON.stringify(master)}];
      clearIndexedDbEventRangeCache("test seed");
    `);
  }

  it("does not duplicate the master on its own start date", () => {
    seedMaster(makeRecurringEvent({ id: "m1", startDate: "2026-03-02", recurrence: { freq: "daily" } }));
    const onStart = w.getComputedEventsForDay("2026-03-02");
    expect(onStart.filter((e) => e.id === "m1" || e._masterId === "m1")).toHaveLength(1);
  });

  it("expands occurrences on later matching days", () => {
    seedMaster(makeRecurringEvent({ id: "m2", startDate: "2026-03-02", recurrence: { freq: "weekly" } }));
    const occ = w.getComputedEventsForDay("2026-03-09");
    const hits = occ.filter((e) => e._masterId === "m2");
    expect(hits).toHaveLength(1);
    expect(hits[0]._occursOn ?? "2026-03-09").toBe("2026-03-09");
  });

  it("respects deleted single occurrences (exceptions)", () => {
    seedMaster(
      makeRecurringEvent({
        id: "m3",
        startDate: "2026-03-02",
        recurrence: { freq: "daily", exceptions: ["2026-03-05"] },
      })
    );
    expect(w.getComputedEventsForDay("2026-03-04").some((e) => e._masterId === "m3")).toBe(true);
    expect(w.getComputedEventsForDay("2026-03-05").some((e) => e._masterId === "m3")).toBe(false);
    expect(w.getComputedEventsForDay("2026-03-06").some((e) => e._masterId === "m3")).toBe(true);
  });
});
