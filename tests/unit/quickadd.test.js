// Quick Add parser tests against the real buildQuickAddFromText().
// Base date fixed at 2026-03-04 (a Wednesday) via selectedDateISO.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  app.eval('selectedDateISO = "2026-03-04"');
});
afterAll(() => harness.close());

const q = (text) => app.window.buildQuickAddFromText(text);

describe("normal title + date parsing", () => {
  it("weekday name resolves to the next matching date", () => {
    const out = q("Dinner with Jimmy friday 7pm");
    expect(out.iso).toBe("2026-03-06");
    expect(out.title).toBe("Dinner with Jimmy");
    expect(out.start).toEqual({ h: 7, mins: 0, ampm: "pm" });
    expect(out.end).toEqual({ h: 8, mins: 0, ampm: "pm" }); // +1h default
  });

  it("m/d dates resolve within the base year", () => {
    const out = q("Lunch 3/10");
    expect(out.iso).toBe("2026-03-10");
    expect(out.title).toBe("Lunch");
  });

  it("relative 'tomorrow' works", () => {
    const out = q("Meeting tomorrow");
    expect(out.iso).toBe("2026-03-05");
    expect(out.title).toBe("Meeting");
    expect(out.start).toBe(null);
  });

  it("title-only input lands on the selected date, all-day", () => {
    const out = q("Buy milk");
    expect(out).toMatchObject({ iso: "2026-03-04", title: "Buy milk", start: null, end: null });
  });
});

describe("times and time ranges", () => {
  it("parses a pm range", () => {
    const out = q("movie 7-9pm");
    expect(out.iso).toBe("2026-03-04");
    expect(out.title).toBe("movie");
    expect(out.start).toEqual({ h: 7, mins: 0, ampm: "pm" });
    expect(out.end).toEqual({ h: 9, mins: 0, ampm: "pm" });
  });

  it("hex color tokens are extracted and removed from the title", () => {
    const out = q("Party #ff0000 friday");
    expect(out.color).toBe("#ff0000");
    expect(out.title).toBe("Party");
    expect(out.iso).toBe("2026-03-06");
  });
});

describe("trip / recurring grammars", () => {
  it("'trip to X from m/d-m/d' creates a span", () => {
    const out = q("trip to Texas from 3/10-3/17");
    expect(out).toMatchObject({
      iso: "2026-03-10",
      title: "Texas",
      repeatFreq: "span",
      spanEnd: "2026-03-17",
    });
  });

  it("'every wed/thu' creates a weeklyDays recurrence", () => {
    const out = q("gym every wed/thu 6-7pm");
    expect(out.repeatFreq).toBe("weeklyDays");
    expect(out.weeklyDays).toEqual([3, 4]);
    expect(out.title).toBe("gym");
    expect(out.start).toEqual({ h: 6, mins: 0, ampm: "pm" });
    expect(out.end).toEqual({ h: 7, mins: 0, ampm: "pm" });
  });
});

describe("invalid / incomplete input", () => {
  it("blank input returns null", () => {
    expect(q("")).toBe(null);
    expect(q("   ")).toBe(null);
  });

  it("filler-only input still produces a safe default event", () => {
    const out = q("at");
    expect(out.title).toBe("New event");
    expect(out.iso).toBe("2026-03-04");
  });
});

describe("input that resembles a price (pinned existing behavior)", () => {
  // KNOWN QUIRK, pinned deliberately: "Coffee 4.50" is not a price grammar
  // Quick Add understands — the bare-time matcher grabs the leading "4" as a
  // 4:00 AM start time and the title keeps the ".50" remainder. If someone
  // improves price handling later, this test is the tripwire that documents
  // the old behavior they are intentionally changing.
  it("'Coffee 4.50' parses the 4 as a time (documented quirk)", () => {
    const out = q("Coffee 4.50");
    expect(out.title).toBe("Coffee .50");
    expect(out.start).toEqual({ h: 4, mins: 0, ampm: "am" });
    expect(out.iso).toBe("2026-03-04");
  });
});
