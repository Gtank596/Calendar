// REGRESSION: Shared Calendars V2-V5 permission and isolation invariants.
//
// Historical bugs / hard rules protected here:
//   * Viewers must not be able to edit/move/delete shared events.
//   * Personal `kind="personal"` mirrors stay read-only through sharing.
//   * Shared events live ONLY in shared state — never personal storage,
//     undo/redo, reminders, or budget.
//   * Optimistic-version conflicts are detected instead of overwriting.
//   * Realtime subscriptions are never duplicated and are torn down on
//     account changes.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { USER_A, USER_B } from "../fixtures/index.js";

let harness, app, w;
let server, owner, viewerCal, sharedRowSeed;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
  server = app.supabaseServer;
  server.addUser(USER_A.email, USER_A.password); // calendar owner
  server.addUser(USER_B.email, USER_B.password); // member (role varies per test)
});
afterAll(() => harness.close());

/** Sign in `email`, refresh shared state, settle. */
async function signInAndRefresh(email) {
  app.advanceClock(20000);
  await server.signOut();
  await app.flush(6);
  app.advanceClock(20000);
  const user = await server.signIn(email);
  await app.flush(10);
  await w.refreshSharedCalendarV2Core("test refresh");
  await app.flush(6);
  return user;
}

function seedSharedWorld(role) {
  // Owner A with one shared calendar; B is a member with the given role.
  server.setRows("calendars", []);
  server.setRows("calendar_members", []);
  server.setRows("calendar_invites", []);
  server.setRows("calendar_events", []);
  const userA = server.state.users.find((u) => u.email === USER_A.email);
  const userB = server.state.users.find((u) => u.email === USER_B.email);
  const cal = server.makeCalendar({ id: "cal-team", ownerId: userA.id, ownerEmail: userA.email, name: "Team", kind: "shared" });
  server.addMember(cal.id, userB, role);
  const row = server.makeSharedEvent({
    id: "sev-1",
    calendarId: cal.id,
    title: "Team standup",
    startDate: "2026-03-12",
    startTime: "9:00 AM",
    version: 1,
  });
  return { cal, row, userA, userB };
}

describe("role enforcement through the real client paths", () => {
  it("a VIEWER cannot move a shared event (0 rows matched, conflict path)", async () => {
    const { row } = seedSharedWorld("viewer");
    await signInAndRefresh(USER_B.email);

    const ev = w.getSharedV2EventsForDay("2026-03-12").find((e) => e._v2Id === "sev-1");
    expect(ev).toBeTruthy();
    expect(ev._role).toBe("viewer");
    expect(w.canEditSharedV2Event(ev)).toBe(false);

    await w.moveSharedV2EventToDate({ v2Id: ev._v2Id, version: ev._version }, "2026-03-20");
    await app.flush(4);
    const after = server.getRows("calendar_events").find((r) => r.id === "sev-1");
    expect(after.start_date).toBe("2026-03-12"); // unchanged
    expect(after.version).toBe(1);
  }, 30000);

  it("an EDITOR can move a shared event; the version bumps", async () => {
    const { row } = seedSharedWorld("editor");
    await signInAndRefresh(USER_B.email);

    const ev = w.getSharedV2EventsForDay("2026-03-12").find((e) => e._v2Id === "sev-1");
    expect(ev._role).toBe("editor");
    expect(w.canEditSharedV2Event(ev)).toBe(true);

    await w.moveSharedV2EventToDate({ v2Id: ev._v2Id, version: ev._version }, "2026-03-20");
    await app.flush(4);
    const after = server.getRows("calendar_events").find((r) => r.id === "sev-1");
    expect(after.start_date).toBe("2026-03-20");
    expect(after.version).toBe(2);
  }, 30000);

  it("a stale optimistic version is detected as a conflict, not an overwrite", async () => {
    const { row } = seedSharedWorld("editor");
    await signInAndRefresh(USER_B.email);

    // Someone else bumped the row first:
    const rows = server.getRows("calendar_events");
    rows.find((r) => r.id === "sev-1").version = 5;
    rows.find((r) => r.id === "sev-1").start_date = "2026-03-15";
    server.setRows("calendar_events", rows);

    // Our client still holds version 1 → the guarded update matches 0 rows.
    await w.moveSharedV2EventToDate({ v2Id: "sev-1", version: 1 }, "2026-03-25");
    await app.flush(4);
    const after = server.getRows("calendar_events").find((r) => r.id === "sev-1");
    expect(after.start_date).toBe("2026-03-15"); // other writer's value survives
    expect(after.version).toBe(5);
    // Conflict UX fired (toast created by handleSharedV2Conflict):
    const toast = app.window.document.getElementById("sharedToast");
    expect(toast?.textContent || "").toMatch(/changed .* first/i);
  }, 30000);

  it("personal mirror calendars are read-only through sharing (not editable)", async () => {
    // B is an EDITOR on A's PERSONAL mirror calendar — even then, edit paths
    // must refuse: editability requires kind === "shared".
    server.setRows("calendars", []);
    server.setRows("calendar_members", []);
    server.setRows("calendar_events", []);
    const userA = server.state.users.find((u) => u.email === USER_A.email);
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    const mirror = server.makeCalendar({ id: "cal-mirror", ownerId: userA.id, ownerEmail: userA.email, name: "A personal", kind: "personal" });
    server.addMember(mirror.id, userB, "editor");
    server.makeSharedEvent({ id: "mev-1", calendarId: mirror.id, title: "A private mirror event", startDate: "2026-03-12" });

    await signInAndRefresh(USER_B.email);
    const ev = w.getSharedV2EventsForDay("2026-03-12").find((e) => e._v2Id === "mev-1");
    expect(ev).toBeTruthy();
    expect(ev._calendarKind).toBe("personal");
    // Mirrors are excluded from every writable-destination list:
    const editable = w.getEditableSharedV2Calendars();
    expect(editable.find((c) => c.id === "cal-mirror")).toBeUndefined();
  }, 30000);
});

describe("shared events stay OUT of personal systems", () => {
  it("shared overlay events never enter personal storage, undo, reminders, or budget", async () => {
    const { row } = seedSharedWorld("viewer");
    await signInAndRefresh(USER_B.email);

    // Visible in the shared overlay:
    const overlay = w.getSharedV2EventsForDay("2026-03-12");
    expect(overlay.some((e) => e._v2Id === "sev-1")).toBe(true);

    // 1. Personal events map: clean.
    expect(app.eval(`JSON.stringify(events)`)).not.toContain("Team standup");
    // 2. Personal localStorage slice: clean.
    expect(app.window.localStorage.getItem("myCalendarEvents_v1") || "{}").not.toContain("Team standup");
    // 3. Personal undo/redo: clean.
    expect(app.eval(`JSON.stringify(undoStack)`)).not.toContain("Team standup");
    // 4. Reminders: a shared event can never produce reminder entries.
    expect(
      w.collectReminderEntries(new Date("2026-03-12T08:00:00").getTime())
        .some((e) => String(e.masterId).includes("sev-1"))
    ).toBe(false);
    // 5. Budget: shared events are not budget items.
    const items = w.getBudgetItems("2026-03-01", "2026-03-31");
    expect(JSON.stringify(items)).not.toContain("Team standup");
    // 6. Personal IndexedDB stores: clean.
    const counts = await w.countIndexedDbStoreRecords();
    expect(counts.events || 0).toBe(0);
    expect(counts.budgetTransactions || 0).toBe(0);
  }, 30000);
});

describe("realtime subscription hygiene", () => {
  it("repeated refreshes never stack duplicate channels", async () => {
    seedSharedWorld("viewer");
    await signInAndRefresh(USER_B.email);
    const after1 = server.activeChannelCount();
    expect(after1).toBe(1);

    await w.refreshSharedCalendarV2Core("again 1");
    await w.refreshSharedCalendarV2Core("again 2");
    await app.flush(6);
    expect(server.activeChannelCount()).toBe(1);
  }, 30000);

  it("realtime updates re-fetch state without duplicating events", async () => {
    seedSharedWorld("viewer");
    await signInAndRefresh(USER_B.email);

    // Server-side change + realtime emit:
    server.emitPostgresChange("calendar_events", {
      id: "sev-1", calendar_id: "cal-team", title: "Team standup (renamed)",
    });
    // The handler debounces 400ms before re-fetching.
    await new Promise((r) => setTimeout(r, 700));
    await app.flush(6);

    const overlay = w.getSharedV2EventsForDay("2026-03-12");
    expect(overlay.filter((e) => e._v2Id === "sev-1")).toHaveLength(1);
  }, 30000);

  it("logout disposes realtime subscriptions", async () => {
    seedSharedWorld("viewer");
    await signInAndRefresh(USER_B.email);
    expect(server.activeChannelCount()).toBe(1);

    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    expect(server.activeChannelCount()).toBe(0);
  }, 30000);
});
