// Unit tests for the app's date/time helpers, exercised on the REAL functions
// loaded from script.js (no copies).

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

describe("ymdToDate / toISOFromDate", () => {
  it("parses ISO dates as LOCAL dates (no UTC off-by-one)", () => {
    const d = w.ymdToDate("2026-03-05");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(5);
  });

  it("round-trips through toISOFromDate", () => {
    expect(w.toISOFromDate(w.ymdToDate("2026-11-30"))).toBe("2026-11-30");
    expect(w.toISOFromDate(w.ymdToDate("2026-01-01"))).toBe("2026-01-01");
  });
});

describe("addDaysISO — month/year/leap boundaries", () => {
  it("crosses a month boundary", () => {
    expect(w.addDaysISO("2026-01-31", 1)).toBe("2026-02-01");
  });
  it("crosses a year boundary", () => {
    expect(w.addDaysISO("2025-12-31", 1)).toBe("2026-01-01");
    expect(w.addDaysISO("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("handles leap years (2024 has Feb 29, 2026 does not)", () => {
    expect(w.addDaysISO("2024-02-28", 1)).toBe("2024-02-29");
    expect(w.addDaysISO("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("isoIsBetween", () => {
  it("is inclusive on both ends", () => {
    expect(w.isoIsBetween("2026-03-10", "2026-03-10", "2026-03-20")).toBe(true);
    expect(w.isoIsBetween("2026-03-20", "2026-03-10", "2026-03-20")).toBe(true);
    expect(w.isoIsBetween("2026-03-09", "2026-03-10", "2026-03-20")).toBe(false);
    expect(w.isoIsBetween("2026-03-21", "2026-03-10", "2026-03-20")).toBe(false);
  });
});

describe("parseClockToMinutes", () => {
  it("parses 12-hour clock strings", () => {
    expect(w.parseClockToMinutes("12:00 AM")).toBe(0);
    expect(w.parseClockToMinutes("12:30 AM")).toBe(30);
    expect(w.parseClockToMinutes("1:00 AM")).toBe(60);
    expect(w.parseClockToMinutes("12:00 PM")).toBe(720);
    expect(w.parseClockToMinutes("11:59 PM")).toBe(1439);
  });
  it("rejects invalid input", () => {
    expect(w.parseClockToMinutes("")).toBe(null);
    expect(w.parseClockToMinutes("25:00 PM")).toBe(null);
    expect(w.parseClockToMinutes("10:60 AM")).toBe(null);
    expect(w.parseClockToMinutes("10 AM")).toBe(null); // needs minutes
  });
});

describe("minutesToClockString", () => {
  it("formats minutes back to 12-hour strings", () => {
    expect(w.minutesToClockString(0)).toBe("12:00 AM");
    expect(w.minutesToClockString(720)).toBe("12:00 PM");
    expect(w.minutesToClockString(725)).toBe("12:05 PM");
    expect(w.minutesToClockString(1439)).toBe("11:59 PM");
  });
  it("clamps out-of-range input into the day", () => {
    expect(w.minutesToClockString(-10)).toBe("12:00 AM");
    expect(w.minutesToClockString(9999)).toBe("11:59 PM");
  });
});

describe("timeToMinutes (24h editor input)", () => {
  it("parses HH:MM", () => {
    expect(w.timeToMinutes("09:30")).toBe(570);
    expect(w.timeToMinutes("00:00")).toBe(0);
    expect(w.timeToMinutes("23:15")).toBe(1395);
  });
  it("empty input maps to 0 (all-day anchor)", () => {
    expect(w.timeToMinutes("")).toBe(0);
  });
});

describe("formatTimeRange — timed / overnight / all-day", () => {
  it("returns empty for all-day (no times)", () => {
    expect(w.formatTimeRange("", "")).toBe("");
  });
  it("single-ended ranges return the one time", () => {
    expect(w.formatTimeRange("10:00 AM", "")).toBe("10:00 AM");
    expect(w.formatTimeRange("", "2:00 PM")).toBe("2:00 PM");
  });
  it("formats a same-meridiem range compactly", () => {
    const out = w.formatTimeRange("7:00 PM", "9:00 PM");
    expect(out).toContain("7");
    expect(out).toContain("9");
    expect(out.toUpperCase()).toContain("PM");
  });
  it("keeps both meridiems for an overnight range", () => {
    const out = w.formatTimeRange("11:00 PM", "1:00 AM").toUpperCase();
    expect(out).toContain("PM");
    expect(out).toContain("AM");
  });
});

describe("drag/resize snapping", () => {
  it("roundToDragStep rounds to the configured step (default 15)", () => {
    expect(w.getDragStepMins()).toBe(15);
    expect(w.roundToDragStep(0)).toBe(0);
    expect(w.roundToDragStep(7)).toBe(0);
    expect(w.roundToDragStep(8)).toBe(15);
    expect(w.roundToDragStep(22)).toBe(15);
    expect(w.roundToDragStep(23)).toBe(30);
  });

  it("snapDeltaFromAnchor snaps the DELTA, preserving off-grid anchors", () => {
    // Anchor at 9:05 (545): moving +14 snaps the delta to +15, not the result
    // to the grid — the event keeps its 5-minute offset.
    expect(w.snapDeltaFromAnchor(545, 545 + 14)).toBe(545 + 15);
    expect(w.snapDeltaFromAnchor(545, 545 + 7)).toBe(545);
    expect(w.snapDeltaFromAnchor(545, 545 - 8)).toBe(545 - 15);
  });
});

describe("isPastDayISO / dimming", () => {
  it("classifies past vs today vs future against the real clock", () => {
    const today = w.toISOFromDate(new w.Date());
    expect(w.isPastDayISO(today)).toBe(false);
    expect(w.isPastDayISO(w.addDaysISO(today, -1))).toBe(true);
    expect(w.isPastDayISO(w.addDaysISO(today, 1))).toBe(false);
  });
});
