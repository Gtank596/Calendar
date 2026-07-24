// UNIT: Trust Layer V1 — activity message formatting, attribution formatting
// (including honest legacy/null handling), safe changed-field filtering, and
// member label resolution.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { USER_A } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  const server = app.supabaseServer;
  server.addUser(USER_A.email, USER_A.password);
  await server.signIn(USER_A.email);
  await app.flush(10);
});
afterAll(() => harness.close());

describe("activity message formatting", () => {
  const base = { actor_email: "sophia@example.com", actor_user_id: "user-sophia", title_snapshot: "Dinner" };

  it("renders every action type readably", () => {
    expect(w.formatSharedActivityMessage({ ...base, action: "create" })).toBe("sophia@example.com created “Dinner”");
    expect(w.formatSharedActivityMessage({ ...base, action: "edit" })).toBe("sophia@example.com changed “Dinner”");
    expect(w.formatSharedActivityMessage({ ...base, action: "move" })).toBe("sophia@example.com moved “Dinner”");
    expect(w.formatSharedActivityMessage({ ...base, action: "delete" })).toBe("sophia@example.com deleted “Dinner”");
    expect(w.formatSharedActivityMessage({ ...base, action: "restore" })).toBe("sophia@example.com restored “Dinner”");
  });

  it("uses 'You' for the signed-in user's own actions", () => {
    const me = app.eval("cloudUser.id");
    const msg = w.formatSharedActivityMessage({ actor_user_id: me, actor_email: USER_A.email, action: "create", title_snapshot: "Lunch" });
    expect(msg).toBe("You created “Lunch”");
  });

  it("degrades safely on missing actor/title", () => {
    expect(w.formatSharedActivityMessage({ action: "create" })).toBe("A member created “an event”");
    expect(w.formatSharedActivityMessage({ action: "edit", title_snapshot: "   " })).toBe("A member changed “an event”");
  });
});

describe("safe changed-field filtering", () => {
  it("drops anything outside the shared-event whitelist", () => {
    const row = {
      changed_fields: ["title", "price", "start_date", "receipt_text", "reminder", "recurrence", "budget_amount"],
    };
    expect(w.safeActivityChangedFields(row)).toEqual(["title", "start_date", "recurrence"]);
    expect(w.safeActivityChangedFields({})).toEqual([]);
    expect(w.safeActivityChangedFields({ changed_fields: "title" })).toEqual([]);
  });
});

describe("attribution formatting (detail modal lines)", () => {
  function seedCalendarState() {
    app.eval(`
      sharedV2State.calendars = [{ id: "cal-x", owner_user_id: "user-owner", owner_email: "owner@example.com", name: "Team", kind: "shared" }];
      sharedV2State.members = { "cal-x": [{ user_id: "user-m1", member_email: "m1@example.com", role: "editor" }] };
      sharedV2State.attributionAvailable = true;
    `);
  }

  it("legacy rows (null attribution) get the honest legacy label — never the owner's name", () => {
    seedCalendarState();
    const ev = { _sharedV2: true, _calendarKind: "shared", _calendarId: "cal-x", _createdBy: null, _updatedBy: null, _version: 1 };
    const lines = w.formatSharedAttributionLines(ev);
    expect(lines).toEqual(["Created before activity history"]);
    expect(lines.join(" ")).not.toContain("owner@example.com");
  });

  it("shows creator and (when actually edited) last editor with member labels", () => {
    seedCalendarState();
    const ev = {
      _sharedV2: true, _calendarKind: "shared", _calendarId: "cal-x",
      _createdBy: "user-owner", _createdAt: "2026-07-01T10:00:00.000Z",
      _updatedBy: "user-m1", _updatedAt: "2026-07-02T11:00:00.000Z",
      _version: 3,
    };
    const lines = w.formatSharedAttributionLines(ev);
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Created by owner@example.com");
    expect(lines[1]).toContain("Last edited by m1@example.com");
  });

  it("never-edited events (version 1) show only the creator line", () => {
    seedCalendarState();
    const ev = {
      _sharedV2: true, _calendarKind: "shared", _calendarId: "cal-x",
      _createdBy: "user-m1", _updatedBy: "user-m1", _version: 1,
    };
    const lines = w.formatSharedAttributionLines(ev);
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("Created by m1@example.com");
  });

  it("personal mirrors and V1 overlay events get no attribution lines", () => {
    seedCalendarState();
    expect(w.formatSharedAttributionLines({ _sharedV2: true, _calendarKind: "personal", _createdBy: "user-owner" })).toEqual([]);
    expect(w.formatSharedAttributionLines({ _shared: true })).toEqual([]);
    expect(w.formatSharedAttributionLines(null)).toEqual([]);
  });

  it("shows nothing when the attribution migration is absent", () => {
    seedCalendarState();
    app.eval(`sharedV2State.attributionAvailable = false`);
    const ev = { _sharedV2: true, _calendarKind: "shared", _calendarId: "cal-x", _createdBy: "user-owner", _version: 1 };
    expect(w.formatSharedAttributionLines(ev)).toEqual([]);
    app.eval(`sharedV2State.attributionAvailable = true`);
  });
});

describe("member label resolution", () => {
  it("resolves you / owner / member / former member", () => {
    const cal = { id: "cal-x", owner_user_id: "user-owner", owner_email: "owner@example.com" };
    app.eval(`sharedV2State.members = { "cal-x": [{ user_id: "user-m1", member_email: "m1@example.com", role: "viewer" }] }`);

    expect(w.resolveSharedMemberLabel(cal, app.eval("cloudUser.id"))).toBe("you");
    expect(w.resolveSharedMemberLabel(cal, "user-owner")).toBe("owner@example.com");
    expect(w.resolveSharedMemberLabel(cal, "user-m1")).toBe("m1@example.com");
    expect(w.resolveSharedMemberLabel(cal, "user-gone")).toBe("a former member");
    expect(w.resolveSharedMemberLabel(cal, null)).toBe(null);
  });
});
