// REGRESSION: Trust Layer V1 — shared-calendar attribution + activity.
//
// Invariants protected here (against the fake's RLS-outcome model — real
// PostgreSQL verification lives in supabase/trust-layer-v1-activity.sql):
//   * Create / edit / move / soft-delete through the REAL client paths
//     produce correct activity rows with server-derived actors.
//   * Spoofed client-supplied created_by / activity rows are ignored/denied.
//   * Personal mirror syncs create NO activity.
//   * Legacy rows (null attribution) still render, with honest labels.
//   * Viewers can read activity but cannot mutate it.
//   * Removed members stop reading activity.
//   * Activity introduces no extra realtime channels; caches are account-scoped.
//   * Missing activity table degrades quietly without breaking calendars.

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

function activityRows() {
  return server.getRows("calendar_activity");
}

describe("activity generation through real client paths", () => {
  it("create → edit → move → soft delete produce correct, server-attributed rows", async () => {
    server.setRows("calendars", []);
    server.setRows("calendar_members", []);
    server.setRows("calendar_events", []);
    server.setRows("calendar_activity", []);
    const userA = server.state.users.find((u) => u.email === USER_A.email);
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    const cal = server.makeCalendar({ id: "cal-act", ownerId: userA.id, ownerEmail: userA.email, name: "Household", kind: "shared" });
    server.addMember(cal.id, userB, "editor");

    const editor = await signInAndRefresh(USER_B.email);

    // CREATE through the main-form path (a real production entry point).
    await w.createSharedV2EventFromMainForm("cal-act", {
      title: "Dinner", details: "", startDate: "2026-07-30",
      startTime: "6:00 pm", endTime: "7:00 pm", color: "#4a90d9",
      categoryId: "other", freq: "none",
    });
    await app.flush(6);

    let rows = activityRows();
    expect(rows.length).toBe(1);
    expect(rows[0].action).toBe("create");
    expect(rows[0].actor_user_id).toBe(editor.id);      // server-derived
    expect(rows[0].actor_email).toBe(USER_B.email);
    expect(rows[0].title_snapshot).toBe("Dinner");

    const evRow = server.getRows("calendar_events").find((r) => r.title === "Dinner");
    expect(evRow.created_by).toBe(editor.id);           // pinned by "trigger"
    expect(evRow.updated_by).toBe(editor.id);

    // MOVE through the real drag/move path.
    const ev = w.getSharedV2EventsForDay("2026-07-30").find((e) => e.title === "Dinner");
    await w.moveSharedV2EventToDate({ v2Id: ev._v2Id, version: ev._version }, "2026-07-31");
    await app.flush(6);
    rows = activityRows();
    expect(rows.length).toBe(2);
    expect(rows[1].action).toBe("move");
    expect(rows[1].changed_fields).toContain("start_date");

    // EDIT (title change) through the shared editor's update path.
    const moved = server.getRows("calendar_events").find((r) => r.title === "Dinner");
    await app.eval(`supabaseClient.from("calendar_events")
      .update({ title: "Dinner (late)" })
      .eq("id", ${JSON.stringify(moved.id)})
      .eq("version", ${moved.version})
      .is("deleted_at", null)
      .select("id")`);
    await app.flush(4);
    rows = activityRows();
    expect(rows.length).toBe(3);
    expect(rows[2].action).toBe("edit");
    expect(rows[2].changed_fields).toEqual(["title"]);
    expect(rows[2].title_snapshot).toBe("Dinner (late)");

    // SOFT DELETE through the real delete path.
    await w.refreshSharedCalendarV2Core("refetch");
    await app.flush(6);
    const ev2 = w.getSharedV2EventsForDay("2026-07-31").find((e) => e.title === "Dinner (late)");
    expect(ev2).toBeTruthy();
    await w.deleteSharedV2Event(ev2);
    await app.flush(6);
    rows = activityRows();
    expect(rows.length).toBe(4);
    expect(rows[3].action).toBe("delete");

    // Version incremented exactly once per write (create=1 + move + edit + delete = 4).
    const finalRow = server.getRows("calendar_events").find((r) => r.id === moved.id);
    expect(finalRow.version).toBe(4);

    // No private fields anywhere in the activity feed.
    const feedJson = JSON.stringify(rows);
    expect(feedJson).not.toMatch(/price|reminder|receipt|merchant|budget|p256dh|endpoint/i);
  }, 60000);

  it("spoofed actor identity in client payloads is ignored", async () => {
    // Still signed in as B (editor). Attempt to claim the event was created
    // by someone else — the pinned trigger emulation must win.
    await app.eval(`supabaseClient.from("calendar_events").insert({
      calendar_id: "cal-act",
      source_event_id: "spoof-1",
      title: "Spoofed",
      start_date: "2026-08-01",
      created_by: "user-mallory",
      updated_by: "user-mallory"
    })`);
    await app.flush(4);

    const row = server.getRows("calendar_events").find((r) => r.source_event_id === "spoof-1");
    const me = server.state.users.find((u) => u.email === USER_B.email);
    expect(row.created_by).toBe(me.id);
    expect(row.updated_by).toBe(me.id);

    const act = activityRows().find((a) => a.title_snapshot === "Spoofed");
    expect(act.actor_user_id).toBe(me.id); // never "user-mallory"
  }, 30000);

  it("clients cannot insert, update, or delete activity rows directly", async () => {
    const before = activityRows().length;

    const ins = await app.eval(`supabaseClient.from("calendar_activity").insert({
      calendar_id: "cal-act", action: "create", actor_email: "forged@example.com", title_snapshot: "Forged"
    })`);
    expect(ins.error).toBeTruthy();
    expect(String(ins.error.code)).toBe("42501");

    const upd = await app.eval(`supabaseClient.from("calendar_activity")
      .update({ actor_email: "rewritten@example.com" }).eq("calendar_id", "cal-act").select("id")`);
    expect((upd.data || []).length).toBe(0); // RLS: silently 0 rows

    await app.eval(`supabaseClient.from("calendar_activity").delete().eq("calendar_id", "cal-act")`);
    expect(activityRows().length).toBe(before); // nothing removed
    expect(activityRows().every((a) => a.actor_email !== "rewritten@example.com")).toBe(true);
  }, 30000);
});

describe("personal mirrors never generate activity", () => {
  it("a full mirror sync of personal events creates zero activity rows", async () => {
    server.setRows("calendar_activity", []);
    await signInAndRefresh(USER_A.email);
    await app.flush(6);

    app.eval(`
      events["2026-08-05"] = [${JSON.stringify(makeEvent({ id: "p-1", title: "Private thing" }))}];
      saveEvents();
    `);
    await w.runCalendarMirrorSync("test", { full: true });
    await app.flush(6);

    // The mirror upserted into A's OWN personal calendar…
    const userA = server.state.users.find((u) => u.email === USER_A.email);
    const personalCal = server.getRows("calendars").find((c) => c.kind === "personal" && c.owner_user_id === userA.id);
    expect(personalCal).toBeTruthy();
    expect(server.getRows("calendar_events").some((r) => r.calendar_id === personalCal.id)).toBe(true);
    // …but produced no activity.
    expect(activityRows().length).toBe(0);
  }, 60000);
});

describe("reading activity: roles, removal, legacy, degradation", () => {
  it("a viewer can read activity but the write paths stay closed", async () => {
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    // Demote B to viewer on cal-act.
    server.removeMember("cal-act", userB.id);
    const cal = server.getRows("calendars").find((c) => c.id === "cal-act");
    expect(cal).toBeTruthy();
    server.addMember("cal-act", userB, "viewer");
    server.makeActivity({ calendarId: "cal-act", action: "create", actorEmail: USER_A.email, title: "Seeded row" });

    await signInAndRefresh(USER_B.email);
    const rows = await w.fetchSharedCalendarActivity("cal-act", { force: true });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.some((r) => r.title_snapshot === "Seeded row")).toBe(true);

    const ins = await app.eval(`supabaseClient.from("calendar_activity").insert({ calendar_id: "cal-act", action: "create" })`);
    expect(String(ins.error?.code)).toBe("42501");
  }, 60000);

  it("a removed member stops receiving activity", async () => {
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    server.removeMember("cal-act", userB.id);

    const res = await app.eval(`supabaseClient.from("calendar_activity").select("id").eq("calendar_id", "cal-act")`);
    expect((res.data || []).length).toBe(0);
  }, 30000);

  it("legacy rows with null attribution still render with honest labels", async () => {
    const userA = server.state.users.find((u) => u.email === USER_A.email);
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    const legacyCal = server.makeCalendar({ id: "cal-legacy", ownerId: userA.id, ownerEmail: userA.email, name: "Old times", kind: "shared" });
    server.addMember(legacyCal.id, userB, "viewer");
    server.makeSharedEvent({ id: "legacy-ev", calendarId: legacyCal.id, title: "Old event", startDate: "2026-08-10" }); // created_by: null

    await signInAndRefresh(USER_B.email);
    const ev = w.getSharedV2EventsForDay("2026-08-10").find((e) => e._v2Id === "legacy-ev");
    expect(ev).toBeTruthy();               // legacy row renders fine
    expect(ev._createdBy).toBe(null);
    expect(w.formatSharedAttributionLines(ev)).toEqual(["Created before activity history"]);
  }, 60000);

  it("activity uses no extra realtime channels, and caches clear on logout", async () => {
    const channels = server.activeChannelCount();
    await w.fetchSharedCalendarActivity("cal-legacy", { force: true });
    expect(server.activeChannelCount()).toBe(channels); // no new channel

    // Cached fetch does not re-query within the cache window:
    const queriesBefore = server.runtime.queryLog.filter((q) => q.table === "calendar_activity").length;
    await w.fetchSharedCalendarActivity("cal-legacy", { force: false });
    const queriesAfter = server.runtime.queryLog.filter((q) => q.table === "calendar_activity").length;
    expect(queriesAfter).toBe(queriesBefore);

    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);
    expect(app.eval(`Object.keys(sharedV2State.activityByCalendar).length`)).toBe(0);
    expect(server.activeChannelCount()).toBe(0);
  }, 60000);

  it("a missing calendar_activity table degrades quietly without breaking calendars", async () => {
    const freshHarness = new AppHarness();
    const freshApp = await freshHarness.boot();
    try {
      const fw = freshApp.window;
      const fserver = freshApp.supabaseServer;
      fserver.addUser(USER_A.email, USER_A.password);
      const userA = fserver.state.users.find((u) => u.email === USER_A.email);
      const cal = fserver.makeCalendar({ id: "cal-nomig", ownerId: userA.id, ownerEmail: userA.email, name: "No migration", kind: "shared" });
      fserver.makeSharedEvent({ id: "nm-1", calendarId: cal.id, title: "Still works", startDate: "2026-08-12" });

      await fserver.signIn(USER_A.email);
      await freshApp.flush(10);
      await fw.refreshSharedCalendarV2Core("test");
      await freshApp.flush(6);

      // Table "missing": inject the canonical missing-table error once.
      fserver.injectError("calendar_activity", "select", { message: 'relation "public.calendar_activity" does not exist', code: "42P01" }, 1);
      const rows = await fw.fetchSharedCalendarActivity(cal.id, { force: true });
      expect(rows).toBe(null);
      expect(freshApp.eval("sharedV2State.activityAvailable")).toBe(false);

      // Probed once: further calls short-circuit without queries.
      const before = fserver.runtime.queryLog.filter((q) => q.table === "calendar_activity").length;
      await fw.fetchSharedCalendarActivity(cal.id, { force: true });
      const after = fserver.runtime.queryLog.filter((q) => q.table === "calendar_activity").length;
      expect(after).toBe(before);

      // Shared events still render fine.
      const ev = fw.getSharedV2EventsForDay("2026-08-12").find((e) => e._v2Id === "nm-1");
      expect(ev).toBeTruthy();
    } finally {
      freshHarness.close();
    }
  }, 60000);
});
