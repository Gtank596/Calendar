// REGRESSION: budget/receipt privacy boundaries.
//
// Invariants protected here:
//   * Personal budget data (prices, reminders, receipt learning, merchant
//     aliases) never appears in shared-calendar payloads.
//   * Shared calendar events never affect budget totals or enter personal
//     IndexedDB budget stores.
//   * Account switching clears private financial state.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeEvent, makePricedEvent, USER_A, USER_B } from "../fixtures/index.js";

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

describe("mirror rows carry no private financial data", () => {
  it("buildMirrorRowFromEvent whitelists display fields only", () => {
    const row = w.buildMirrorRowFromEvent(
      makePricedEvent({
        id: "m-priv-1",
        reminder: { offsetMinutes: 30 },
        details: "notes ok to share",
        receiptMemory: { secret: 1 },
        merchantAlias: "WalMart#123",
      }),
      "2026-03-10"
    );
    expect(Object.keys(row).sort()).toEqual(
      ["category_id", "color", "details", "end_time", "recurrence", "source_event_id", "start_date", "start_time", "title"].sort()
    );
    const flat = JSON.stringify(row);
    expect(flat).not.toContain("82.45");       // price
    expect(flat).not.toContain("offsetMinutes"); // reminder
    expect(flat).not.toContain("secret");
    expect(flat).not.toContain("WalMart#123");
  });

  it("the full mirror sync uploads sanitized rows and skips budget events (Hard Rule 7)", async () => {
    app.advanceClock(20000);
    await server.signIn(USER_A.email);
    await app.flush(10);
    await w.refreshSharedCalendarV2Core("test");
    await app.flush(6);

    app.eval(`
      events["2026-03-10"] = [
        ${JSON.stringify(makePricedEvent({ id: "p-ev-1", title: "Groceries run", reminder: { offsetMinutes: 15 } }))},
        ${JSON.stringify(makeEvent({ id: "b-ev-1", title: "Budget-origin row", source: "budget", price: 12 }))}
      ];
      saveEvents();
    `);
    await w.runCalendarMirrorSync("test", { full: true });
    await app.flush(4);

    const mirrorRows = server.getRows("calendar_events")
      .filter((r) => r.source_event_id === "p-ev-1" || r.source_event_id === "b-ev-1");
    // The personal event was mirrored…
    expect(mirrorRows.some((r) => r.source_event_id === "p-ev-1")).toBe(true);
    // …the budget-origin event was NOT (Hard Rule 7)…
    expect(mirrorRows.some((r) => r.source_event_id === "b-ev-1")).toBe(false);
    // …and nothing financial survived in the uploaded row.
    const flat = JSON.stringify(mirrorRows);
    expect(flat).not.toContain("82.45");
    expect(flat).not.toContain("offsetMinutes");
  }, 30000);
});

describe("shared events cannot touch budget state", () => {
  it("shared overlay events never change budget totals or IndexedDB budget stores", async () => {
    // A's own budget baseline:
    const before = w.getBudgetItems("2026-03-01", "2026-03-31");

    // A shared calendar someone else owns, with a "priced-looking" event:
    const userB = server.state.users.find((u) => u.email === USER_B.email);
    const userA = server.state.users.find((u) => u.email === USER_A.email);
    const cal = server.makeCalendar({ id: "cal-x", ownerId: userB.id, ownerEmail: userB.email, kind: "shared", name: "X" });
    server.addMember(cal.id, userA, "viewer");
    server.makeSharedEvent({
      id: "sx-1", calendarId: "cal-x", title: "Dinner $200", startDate: "2026-03-15",
    });
    // Realtime burst → refresh:
    server.emitPostgresChange("calendar_events", { id: "sx-1", calendar_id: "cal-x" });
    await w.refreshSharedCalendarV2Core("test");
    await app.flush(6);

    expect(w.getSharedV2EventsForDay("2026-03-15").some((e) => e._v2Id === "sx-1")).toBe(true);

    const after = w.getBudgetItems("2026-03-01", "2026-03-31");
    expect(after.map((i) => i.id).sort()).toEqual(before.map((i) => i.id).sort());
    expect(JSON.stringify(after)).not.toContain("Dinner $200");

    const counts = await w.countIndexedDbStoreRecords();
    // Only A's own priced event may be in the budget store — never sx-1:
    const db = await w.openCalendarIndexedDb();
    const txRows = await new Promise((resolve) => {
      const tx = db.transaction(["budgetTransactions"], "readonly");
      const req = tx.objectStore("budgetTransactions").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    expect(JSON.stringify(txRows)).not.toContain("sx-1");
    expect(JSON.stringify(txRows)).not.toContain("Dinner $200");
  }, 30000);
});

describe("receipt learning stays private and account-scoped", () => {
  it("receipt/merchant learning keys are cleared on account switch", async () => {
    // Resolve the REAL storage keys from the app itself — no guessed strings.
    const memoryKey = app.eval(`getSliceStorageKey("receiptItemCategoryMemory")`);
    const aliasKey = app.eval(`getSliceStorageKey("merchantAliases")`);
    const trainingKey = app.eval(`getSliceStorageKey("receiptTrainingRecords")`);
    expect(memoryKey).toBeTruthy();
    expect(aliasKey).toBeTruthy();
    expect(trainingKey).toBeTruthy();

    // Seed learning data as the signed-in account:
    app.window.localStorage.setItem(memoryKey, JSON.stringify({ phrase: { food: 3 } }));
    app.window.localStorage.setItem(aliasKey, JSON.stringify({ walmart: { clean: "Walmart" } }));
    app.window.localStorage.setItem(trainingKey, JSON.stringify([{ id: "t1" }]));

    // All three must be in the account-scoped clear list:
    const keys = app.eval("JSON.stringify(getAccountScopedLocalStorageKeys())");
    expect(keys).toContain(memoryKey);
    expect(keys).toContain(aliasKey);
    expect(keys).toContain(trainingKey);

    app.advanceClock(20000);
    await w.logoutCloud();
    await app.flush(10);

    // The clear re-persists EMPTY defaults (privacy-clear baseline), so the
    // requirement is: none of the seeded learning content survives.
    for (const [key, marker] of [
      [memoryKey, "food"],
      [aliasKey, "walmart"],
      [trainingKey, "t1"],
    ]) {
      const raw = app.window.localStorage.getItem(key);
      expect(raw === null || !raw.includes(marker), `${key} still holds learned data`).toBe(true);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        const size = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        expect(size, `${key} should be empty after the clear`).toBe(0);
      }
    }
  }, 30000);

  it("learning data never rides along in shared calendar_events rows", () => {
    const rows = server.getRows("calendar_events");
    const flat = JSON.stringify(rows);
    expect(flat).not.toContain("ReceiptMemory");
    expect(flat).not.toContain("receiptTraining");
    expect(flat).not.toContain("merchantAlias");
  });
});
