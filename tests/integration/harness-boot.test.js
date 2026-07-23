// Proves the test harness itself: the real, unmodified script.js boots inside
// jsdom with fake IndexedDB + fake Supabase, with no uncaught errors, and its
// top-level functions are reachable. Every other suite builds on this.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";

describe("harness: real app boots under jsdom", () => {
  let harness;
  let app;

  beforeAll(async () => {
    harness = new AppHarness();
    app = await harness.boot();
  });

  afterAll(() => harness.close());

  it("loads index.html DOM and runs script.js to completion", () => {
    expect(app.window.document.getElementById("quickAddInput")).toBeTruthy();
    // Top-level function declarations are window globals in a classic script.
    expect(typeof app.window.recurrenceMatches).toBe("function");
    expect(typeof app.window.sanitizeSharedEvent).toBe("function");
    expect(typeof app.window.handleAuthUserChange).toBe("function");
  });

  it("reports no uncaught page errors during boot", () => {
    expect(app.consoleErrors).toEqual([]);
  });

  it("uses the fake Supabase client (never the real SDK)", () => {
    expect(app.supabaseServer).toBeTruthy();
    expect(app.window.supabase.__fakeServer).toBe(app.supabaseServer);
  });

  it("has working fake IndexedDB", async () => {
    const summary = await app.window.getCalendarStorageDebugSummary();
    expect(summary).toBeTruthy();
  });
});
