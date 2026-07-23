// Shared/mirror event sanitization: nothing private may survive sharing.
// Exercises the real sanitizeSharedEvent (V1) and sanitizeSharedV2Event (V2-V5).

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makePrivateLeakyEvent, makeSharedEventRow } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

// Fields that must be hard-stripped (nulled/emptied) on every shared event.
const STRIPPED = {
  price: null,
  reminder: null,
  span: null,
  connections: [],
  connectionGroupId: "",
  connectionGroupName: "",
  connectionGroupIds: [],
};

describe("sanitizeSharedEvent (V1 legacy sharing)", () => {
  it("strips price, budget, reminder, push, connection, and span data", () => {
    const out = w.sanitizeSharedEvent(makePrivateLeakyEvent(), "owner-1", "owner@example.com");
    expect(out).toBeTruthy();
    for (const [key, value] of Object.entries(STRIPPED)) {
      expect(out[key], `field ${key} must be stripped`).toEqual(value);
    }
  });

  it("never carries receipt/OCR memory, merchant aliases, or training data", () => {
    const out = w.sanitizeSharedEvent(makePrivateLeakyEvent(), "owner-1", "owner@example.com");
    expect(out.receiptMemory).toBeUndefined();
    expect(out.merchantAliases).toBeUndefined();
    expect(out.receiptTraining).toBeUndefined();
  });

  it("keeps only display fields and marks the event shared", () => {
    const out = w.sanitizeSharedEvent(makePrivateLeakyEvent({ id: "raw-1" }), "owner-1", "owner@example.com");
    expect(out._shared).toBe(true);
    expect(out.id).toBe("shared:owner-1:raw-1");
    expect(out.title).toBe("Therapy");
    expect(out.startDate).toBe("2026-04-01");
  });

  it("rejects records without a start date", () => {
    expect(w.sanitizeSharedEvent(makePrivateLeakyEvent({ startDate: "", dateISO: "" }), "o", "e")).toBe(null);
  });
});

describe("sanitizeSharedV2Event (Shared Calendars V2-V5)", () => {
  const cal = { id: "cal-9", name: "Team", kind: "shared", owner_email: "own@example.com" };

  it("strips everything private even if the row smuggles extra fields", () => {
    const row = makeSharedEventRow({
      id: "row-1",
      // fields that should never exist on calendar_events rows, but if they
      // ever do, the sanitizer must not let them through:
      price: 999,
      reminder: { offsetMinutes: 5 },
      span: { mode: "bg", end: "2026-05-05" },
      receiptMemory: { secret: true },
    });
    const out = w.sanitizeSharedV2Event(row, cal);
    expect(out).toBeTruthy();
    for (const [key, value] of Object.entries(STRIPPED)) {
      expect(out[key], `field ${key} must be stripped`).toEqual(value);
    }
    expect(out.receiptMemory).toBeUndefined();
  });

  it("carries calendar context and version for optimistic locking", () => {
    const out = w.sanitizeSharedV2Event(makeSharedEventRow({ id: "row-2", version: 7 }), cal);
    expect(out).toMatchObject({
      _shared: true,
      _sharedV2: true,
      _v2Id: "row-2",
      _version: 7,
      _calendarId: "cal-9",
      _calendarKind: "shared",
    });
  });

  it("drops soft-deleted rows and rows without a start date", () => {
    expect(w.sanitizeSharedV2Event(makeSharedEventRow({ deleted_at: "2026-01-01T00:00:00Z" }), cal)).toBe(null);
    expect(w.sanitizeSharedV2Event(makeSharedEventRow({ start_date: "" }), cal)).toBe(null);
    expect(w.sanitizeSharedV2Event(null, cal)).toBe(null);
  });
});
