// Reusable deterministic fixtures. Builders return plain data in the shapes
// the production code already consumes — they never re-implement app logic.

let seq = 0;
function nextId(prefix) {
  seq += 1;
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

/** Personal calendar event (legacy per-day map shape used by `events`). */
export function makeEvent(overrides = {}) {
  return {
    id: overrides.id || nextId("evt"),
    title: "Dentist appointment",
    details: "",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    color: "#7a5aff",
    categoryId: "other",
    recurrence: { freq: "none" },
    price: null,
    reminder: null,
    ...overrides,
  };
}

/** Recurring master event. `startDate` is required by the recurrence engine. */
export function makeRecurringEvent(overrides = {}) {
  return makeEvent({
    title: "Gym",
    startDate: "2026-03-02", // a Monday
    recurrence: { freq: "weekly", interval: 1, exceptions: [], ...overrides.recurrence },
    ...overrides,
  });
}

/** Event carrying a valid price (budget-convertible). */
export function makePricedEvent(overrides = {}) {
  return makeEvent({ title: "Groceries", price: 82.45, categoryId: "food", ...overrides });
}

/** Event with a reminder offset. */
export function makeReminderEvent(overrides = {}) {
  return makeEvent({ title: "Standup", reminder: { offsetMinutes: 15 }, ...overrides });
}

/** IndexedDB budget-transaction record (see normalizeBudgetTransactionRecord). */
export function makeTransactionRecord(overrides = {}) {
  return {
    id: overrides.id || nextId("tx"),
    eventId: overrides.eventId || nextId("txevt"),
    title: "Coffee",
    dateISO: "2026-03-10",
    price: 4.5,
    categoryId: "food",
    source: "budget",
    updatedAt: 1750000000000,
    ...overrides,
  };
}

/** Fake-cloud users for the account-switching scenarios. */
export const USER_A = { email: "alice@example.com", password: "pw-a" };
export const USER_B = { email: "bob@example.com", password: "pw-b" };

/** Shared calendar_events row (fake Supabase table shape). */
export function makeSharedEventRow(overrides = {}) {
  return {
    id: overrides.id || nextId("shevt"),
    calendar_id: overrides.calendar_id || "cal-1",
    source_event_id: nextId("src"),
    title: "Team sync",
    details: "",
    start_date: "2026-03-12",
    start_time: "9:00 AM",
    end_time: "9:30 AM",
    color: "#4a90d9",
    category_id: "other",
    recurrence: { freq: "none" },
    version: 1,
    deleted_at: null,
    ...overrides,
  };
}

/**
 * A "raw" shared event as it might arrive from another user's payload,
 * deliberately stuffed with private fields that MUST be stripped by
 * sanitizeSharedEvent / sanitizeSharedV2Event.
 */
export function makePrivateLeakyEvent(overrides = {}) {
  return {
    id: overrides.id || nextId("leaky"),
    title: "Therapy",
    details: "notes",
    startDate: "2026-04-01",
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    color: "#ff0000",
    categoryId: "health",
    recurrence: { freq: "none" },
    // Private things that must never survive sharing:
    price: 240,
    reminder: { offsetMinutes: 30 },
    span: { mode: "bg", end: "2026-04-03" },
    connections: [{ id: "cg-1", name: "Care", color: "#ff0000" }],
    connectionGroupId: "cg-1",
    connectionGroupName: "Care",
    connectionGroupIds: ["cg-1"],
    receiptMemory: { secret: true },
    merchantAliases: { "dr smith": "Dr. Smith" },
    ...overrides,
  };
}
