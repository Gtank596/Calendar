// loadApp.js — boots the REAL Vanguard Calendar app (index.html + script.js,
// unmodified) inside a jsdom window for Vitest.
//
// Design:
//   * Each `AppHarness` owns durable "device" state: a localStorage snapshot,
//     a fake-indexeddb IDBFactory, and the fake Supabase server state. Booting
//     again on the same harness simulates a page reload on the same device;
//     a new harness simulates a fresh device/profile.
//   * Each boot creates a fresh JSDOM whose window is a real vm context. The
//     fake Supabase implementation is evaluated INSIDE that context first, so
//     app and fake share one realm, then script.js runs with its real
//     filename for readable stack traces.
//   * script.js top-level functions are classic-script globals, so tests call
//     production code directly via `app.window.<fn>` — no copies of
//     production logic live in the tests.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { JSDOM, VirtualConsole } from "jsdom";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const appSource = readFileSync(join(root, "script.js"), "utf8");
const fakeSupabaseSource = readFileSync(
  join(root, "tests", "mocks", "fake-supabase.global.js"),
  "utf8"
);

export class AppHarness {
  constructor() {
    this.localStorageData = new Map(); // persists across boots ("device disk")
    this.idbFactory = new IDBFactory(); // persists across boots
    this.supabaseState = {};            // fake Supabase server durable state
    this.app = null;
  }

  /** Wipe the simulated device storage (NOT the fake cloud). */
  resetDevice() {
    this.localStorageData = new Map();
    this.idbFactory = new IDBFactory();
  }

  /**
   * Boot the app. Simulates a page load: fresh window + DOM, persistent
   * localStorage/IndexedDB/cloud.
   */
  async boot({ online = true } = {}) {
    if (this.app) this.close();

    const consoleErrors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", (...args) => consoleErrors.push(args.map(String).join(" ")));
    virtualConsole.on("jsdomError", (err) => {
      // jsdom reports canvas/getContext gaps here; those are environment
      // limitations, not app errors, so keep them separate.
      const msg = String(err && err.message || err);
      if (!/not implemented/i.test(msg)) consoleErrors.push("jsdomError: " + msg);
    });

    const dom = new JSDOM(indexHtml, {
      url: "http://127.0.0.1:8123/",
      runScripts: "outside-only", // <script> tags stay inert; we run JS below
      pretendToBeVisual: true,     // provides requestAnimationFrame
      virtualConsole,
    });

    const window = dom.window;
    const context = dom.getInternalVMContext();

    // --- restore the persistent "device" storage --------------------------
    for (const [k, v] of this.localStorageData) window.localStorage.setItem(k, v);
    window.indexedDB = this.idbFactory;
    window.IDBKeyRange = IDBKeyRange;
    if (typeof window.structuredClone !== "function") {
      window.structuredClone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
    }

    // --- deterministic environment stubs ----------------------------------
    window.fetch = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    }); // weather & co. degrade gracefully offline; nothing leaves the process
    window.alert = () => {};
    window.confirm = () => true;
    window.prompt = () => "";
    window.scrollTo = () => {};
    if (!online) {
      Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    }

    // --- fake Supabase (same realm as the app) ----------------------------
    window.__VANGUARD_FAKE_SUPABASE_STATE__ = this.supabaseState;
    vm.runInContext(fakeSupabaseSource, context, {
      filename: join(root, "tests", "mocks", "fake-supabase.global.js"),
    });
    const supabaseServer = window.__vanguardFakeSupabaseServer;

    // --- run the real application -----------------------------------------
    vm.runInContext(appSource, context, { filename: join(root, "script.js") });

    const app = {
      harness: this,
      dom,
      window,
      context,
      supabaseServer,
      consoleErrors,
      /**
       * Shift the app realm's Date.now() forward by `ms`. Several privacy
       * guards (e.g. clearAccountScopedLocalState's 15s dedupe) are
       * wall-clock windows a fast test must be able to step past.
       */
      advanceClock(ms) {
        vm.runInContext(
          `(function(){
            if(!window.__clockSkewInstalled){
              window.__clockSkew = 0;
              const realNow = Date.now.bind(Date);
              Date.now = function(){ return realNow() + window.__clockSkew; };
              window.__clockSkewInstalled = true;
            }
            window.__clockSkew += ${Number(ms)};
          })();`,
          context
        );
      },
      /**
       * Evaluate an expression inside the app's realm. Needed for top-level
       * `let`/`const` app state (e.g. `selectedDateISO`, the `events` map),
       * which lives in the context's global lexical scope, not on `window`.
       */
      eval(code) {
        return vm.runInContext(code, context, { filename: "harness-eval.js" });
      },
      /** Let queued microtasks + zero-delay timers run. */
      async flush(rounds = 8) {
        for (let i = 0; i < rounds; i++) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      },
      /** Persist window.localStorage back to the harness (like a real disk). */
      syncStorageDown() {
        const map = new Map();
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          map.set(key, window.localStorage.getItem(key));
        }
        app.harness.localStorageData = map;
      },
    };

    // Let the app's startup async work (IndexedDB bootstrap, initCloudSync,
    // shared-calendar refresh) settle before tests poke at it.
    await app.flush(12);

    this.app = app;
    return app;
  }

  /** Simulate closing the tab: persist storage, drop the window. */
  close() {
    if (!this.app) return;
    this.app.syncStorageDown();
    try { this.app.dom.window.close(); } catch { /* timers already gone */ }
    this.app = null;
  }

  /** Simulate a full page reload on the same device. */
  async reload(options) {
    this.close();
    return this.boot(options);
  }
}

/** One-shot convenience for tests that need a single booted app. */
export async function loadApp(options) {
  const harness = new AppHarness();
  const app = await harness.boot(options);
  return app;
}
