// Budget logic tests against the real script.js functions.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";
import { makeTransactionRecord, makePricedEvent, makeEvent } from "../fixtures/index.js";

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

beforeEach(() => {
  // Reset events AND bump the state version so getBudgetItems' derived cache
  // cannot serve results computed from a previous test's data.
  app.eval(`
    events = {};
    state.meta.eventsVersion = (state.meta.eventsVersion || 0) + 1;
    clearIndexedDbEventRangeCache("test reset");
    clearIndexedDbBudgetTransactionRangeCache("test reset");
  `);
});

describe("normalizeBudgetTransactionRecord — income vs expense", () => {
  it("positive price normalizes to an expense", () => {
    const tx = w.normalizeBudgetTransactionRecord(makeTransactionRecord({ price: 12.5 }));
    expect(tx.type).toBe("expense");
    expect(tx.price).toBe(12.5);
    expect(tx.dateType.endsWith("::expense")).toBe(true);
  });

  it("negative price normalizes to income", () => {
    const tx = w.normalizeBudgetTransactionRecord(makeTransactionRecord({ price: -2000 }));
    expect(tx.type).toBe("income");
    expect(tx.dateType.endsWith("::income")).toBe(true);
  });

  it("rejects records without id, date, or a finite non-zero price", () => {
    expect(w.normalizeBudgetTransactionRecord(makeTransactionRecord({ price: 0 }))).toBe(null);
    expect(w.normalizeBudgetTransactionRecord(makeTransactionRecord({ price: NaN }))).toBe(null);
    expect(w.normalizeBudgetTransactionRecord(makeTransactionRecord({ dateISO: "", date: "", startDate: "" }))).toBe(null);
    expect(w.normalizeBudgetTransactionRecord({ price: 5, dateISO: "2026-01-01" })).toBe(null);
  });
});

describe("budgetTransactionFromEventRecord — event → transaction conversion", () => {
  it("converts a priced event", () => {
    const tx = w.budgetTransactionFromEventRecord({
      id: "e1", title: "Groceries", price: 82.45, dateISO: "2026-03-10", categoryId: "food",
    });
    expect(tx).toMatchObject({ id: "event:e1", eventId: "e1", type: "expense", price: 82.45 });
  });

  it("returns null for zero/absent price (no phantom transactions)", () => {
    expect(w.budgetTransactionFromEventRecord(makeEvent({ id: "e2", dateISO: "2026-03-10", price: null }))).toBe(null);
    expect(w.budgetTransactionFromEventRecord(makeEvent({ id: "e3", dateISO: "2026-03-10", price: 0 }))).toBe(null);
  });
});

describe("getBudgetCategoryTotals", () => {
  it("sums per category, drops non-positive totals, sorts descending", () => {
    // The default install has only "other" — seed real categories first.
    app.eval(`
      budgetCategories = [
        { id: "other", name: "Other", color: "#7a5aff", budgets: { week:0, month:0, year:0 } },
        { id: "food", name: "Food", color: "#22aa66", budgets: { week:0, month:0, year:0 } },
        { id: "fun", name: "Fun", color: "#dd7711", budgets: { week:0, month:0, year:0 } },
        { id: "bills", name: "Bills", color: "#3366dd", budgets: { week:0, month:0, year:0 } }
      ];
    `);
    const items = [
      { categoryId: "food", price: 10 },
      { categoryId: "food", price: 5 },
      { categoryId: "fun", price: 40 },
      { categoryId: "bills", price: -20 }, // income-like → excluded (total <= 0)
    ];
    const totals = w.getBudgetCategoryTotals(items);
    expect(totals.map((t) => t.id)).toEqual(["fun", "food"]);
    expect(totals[0].total).toBe(40);
    expect(totals[1].total).toBe(15);
  });

  it("unknown category ids fold into 'other'", () => {
    app.eval(`budgetCategories = loadBudgetCategories();`);
    const totals = w.getBudgetCategoryTotals([{ categoryId: "nope", price: 9 }]);
    expect(totals).toHaveLength(1);
    expect(totals[0].id).toBe("other");
  });
});

describe("mergeBudgetItemsByKey", () => {
  it("deduplicates by id across groups (first occurrence wins)", () => {
    const a = [{ id: "x__2026-03-10", date: "2026-03-10", title: "A", price: 5 }];
    const b = [
      { id: "x__2026-03-10", date: "2026-03-10", title: "A dup", price: 7 },
      { id: "y__2026-03-10", date: "2026-03-10", title: "B", price: 3 },
    ];
    const merged = w.mergeBudgetItemsByKey(a, b);
    expect(merged).toHaveLength(2);
    expect(merged.find((i) => i.id === "x__2026-03-10").price).toBe(5);
  });

  it("drops items without a date (nothing renderable without one)", () => {
    expect(w.mergeBudgetItemsByKey([{ id: "no-date", price: 5 }])).toHaveLength(0);
  });
});

describe("recurring budget transactions", () => {
  it("computeRecurringBudgetItemsUncached expands a priced monthly master", () => {
    // Recurring budget items come from priced recurring EVENTS; the master's
    // own start date is excluded (it is already a direct event).
    const master = {
      id: "rec1", title: "Rent", price: 1200, categoryId: "other",
      startDate: "2026-01-01",
      recurrence: { freq: "monthly", interval: 1 },
    };
    app.eval(`
      events["2026-01-01"] = [${JSON.stringify(master)}];
      state.meta.eventsVersion = (state.meta.eventsVersion || 0) + 1;
      clearIndexedDbEventRangeCache("seed");
    `);
    const items = w.computeRecurringBudgetItemsUncached("2026-01-01", "2026-03-31");
    const rent = items.filter((i) => i.title === "Rent");
    expect(new Set(rent.map((i) => i.date))).toEqual(
      new Set(["2026-02-01", "2026-03-01"])
    );
    expect(rent.every((i) => i.isOccurrence && i.price === 1200)).toBe(true);
  });
});

describe("duplicate-receipt detection", () => {
  function seedPricedEvent(dateISO, title, price) {
    const ev = makePricedEvent({ title, price });
    app.eval(`
      events[${JSON.stringify(dateISO)}] = (events[${JSON.stringify(dateISO)}] || []);
      events[${JSON.stringify(dateISO)}].push(${JSON.stringify(ev)});
      state.meta.eventsVersion = (state.meta.eventsVersion || 0) + 1;
      clearIndexedDbEventRangeCache("seed");
      clearIndexedDbBudgetTransactionRangeCache("seed");
    `);
  }

  it("flags a same-merchant same-amount same-day entry as a duplicate", () => {
    seedPricedEvent("2026-03-10", "Walmart", 45.2);
    const hit = w.findPossibleReceiptDuplicate({ merchant: "Walmart", amount: 45.2, date: "2026-03-10" });
    expect(hit).toBeTruthy();
    expect(hit.item.title).toBe("Walmart");
    expect(hit.score).toBeGreaterThanOrEqual(75);
  });

  it("does not flag a clearly different amount", () => {
    seedPricedEvent("2026-03-10", "Walmart", 45.2);
    expect(w.findPossibleReceiptDuplicate({ merchant: "Walmart", amount: 90, date: "2026-03-10" })).toBe(null);
  });

  it("does not flag when nothing similar exists nearby", () => {
    seedPricedEvent("2026-03-01", "Walmart", 45.2);
    expect(w.findPossibleReceiptDuplicate({ merchant: "Walmart", amount: 45.2, date: "2026-03-10" })).toBe(null);
  });
});

describe("Smart Suggestions hygiene", () => {
  it("budget-originated records never form suggestion patterns", () => {
    // Three same-weekday "Gym" events → a real pattern...
    app.eval(`
      events = {
        "2026-02-09": [${JSON.stringify(makeEvent({ id: "g1", title: "Gym" }))}],
        "2026-02-16": [${JSON.stringify(makeEvent({ id: "g2", title: "Gym" }))}],
        "2026-02-23": [${JSON.stringify(makeEvent({ id: "g3", title: "Gym" }))}],
        "2026-02-10": [${JSON.stringify(makeEvent({ id: "b1", title: "Rent", source: "budget" }))}],
        "2026-02-17": [${JSON.stringify(makeEvent({ id: "b2", title: "Rent", source: "budget" }))}],
        "2026-02-24": [${JSON.stringify(makeEvent({ id: "b3", title: "Rent", source: "budget" }))}]
      };
      clearIndexedDbEventRangeCache("seed");
    `);
    const suggestions = w.getSuggestionsForRange(w.ymdToDate("2026-03-01"), 14) || [];
    const titles = suggestions.map((s) => (s.title || "").toLowerCase());
    // ...while the budget-sourced "Rent" trio must never become a suggestion.
    expect(titles).not.toContain("rent");
  });
});
