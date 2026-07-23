// REGRESSION: global naming collisions.
//
// Historical bug prevented here: a public debug wrapper
// (window.refreshSharedCalendars) was once given the SAME NAME as the
// internal implementation, so the wrapper shadowed it and recursively called
// itself until the stack blew. The fix is the `...Core` convention: internal
// async implementations end in Core; window.* wrappers call the Core
// functions.
//
// This suite (a) proves the wrappers terminate and reach their Core
// implementations, and (b) statically flags duplicated top-level function
// declarations, pinned to a documented allowlist so NEW duplicates fail CI.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AppHarness } from "../helpers/loadApp.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

let harness, app, w;

beforeAll(async () => {
  harness = new AppHarness();
  app = await harness.boot();
  w = app.window;
});
afterAll(() => harness.close());

describe("public wrappers vs Core implementations", () => {
  it("wrapper and Core are distinct functions (no self-shadowing)", () => {
    expect(typeof w.refreshSharedCalendars).toBe("function");
    expect(typeof w.refreshSharedCalendarsCore).toBe("function");
    expect(w.refreshSharedCalendars).not.toBe(w.refreshSharedCalendarsCore);
    expect(typeof w.refreshSharedCalendarV2Core).toBe("function");
  });

  it("wrappers delegate to the Core name, not to themselves", () => {
    const src = String(w.refreshSharedCalendars);
    expect(src).toContain("refreshSharedCalendarsCore(");
    // A wrapper calling its own name again would be the recursion bug:
    expect(src.replace(/refreshSharedCalendarsCore/g, "")).not.toContain("refreshSharedCalendars(");
  });

  it("calling the public wrapper terminates (signed out: fast no-op path)", async () => {
    // The recursion bug crashed instantly regardless of auth state; a clean
    // run to completion is the proof it is gone.
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("wrapper did not return")), 5000);
      Promise.resolve(w.refreshSharedCalendars()).then(() => { clearTimeout(t); resolve(); }, reject);
    });
    await app.flush(6);
    expect(true).toBe(true);
  }, 15000);
});

describe("duplicated top-level function declarations (static scan)", () => {
  it("no NEW duplicate top-level function names appear in script.js", () => {
    const src = readFileSync(join(root, "script.js"), "utf8");
    const names = [...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm)]
      .map((m) => m[1]);
    const counts = new Map();
    for (const n of names) counts.set(n, (counts.get(n) || 0) + 1);
    const dupes = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort();

    // KNOWN pre-existing duplicates (documented in QUALITY-FOUNDATION-V1.md):
    // the later declaration silently overrides the earlier one. They are
    // currently harmless (same-shape helpers) but frozen here — if this list
    // grows, a new silent override just landed and this test fails.
    const KNOWN_DUPLICATES = ["clamp", "closeBudgetInsightsMenu", "pad2"];
    expect(dupes).toEqual(KNOWN_DUPLICATES);
  });

  it("no top-level function name ends with Core AND exists without Core", () => {
    // Guards the convention itself: refreshX and refreshXCore existing as two
    // top-level declarations invites the shadowing bug back. Wrappers must be
    // window.* assignments, not sibling declarations.
    const src = readFileSync(join(root, "script.js"), "utf8");
    const names = new Set(
      [...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map((m) => m[1])
    );
    const offenders = [...names].filter((n) => n.endsWith("Core") && names.has(n.slice(0, -4)));
    expect(offenders).toEqual([]);
  });
});
