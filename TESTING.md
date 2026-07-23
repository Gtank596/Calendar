# Testing Vanguard Calendar

The app itself is a static, no-build vanilla HTML/CSS/JS PWA. Everything in
this document is **development equipment around it** — none of it is a
production runtime dependency, and the app stays deployable as plain files.

## Prerequisites

- Node.js 18+ (the project is developed against Node 18 LTS)
- npm (comes with Node)
- ~500 MB free disk for the Playwright Chromium build (first run only)

## Installation

```bash
npm ci                                # exact versions from package-lock.json
npx playwright install chromium       # browser for the e2e tests (once)
```

## Commands

| Command | What it does |
|---|---|
| `npm run check:syntax` | Parses every first-party JS file (`node --check`, correct parse goal per file). Never executes the app. |
| `npm run check:ids` | Parses `index.html` with jsdom and fails on duplicate static `id`s. |
| `npm run test:unit` | Vitest unit + integration suites (`tests/unit`, `tests/integration`). |
| `npm run test:regression` | Vitest regression suites (`tests/regression`). |
| `npm run test:coverage` | All Vitest suites with V8 coverage (report in `coverage/`). |
| `npm run test:e2e` | Playwright browser tests (`tests/e2e`) against a local static server. |
| `npm run test:ci` | The full non-interactive CI sequence: syntax → ids → coverage → e2e. |
| `npm run serve` | Dependency-free static server at http://127.0.0.1:8123 for manual testing. |

## Directory organization

```
tests/
├── unit/           # pure-logic tests (dates, recurrence, quick add, budget,
│                   # shared-event sanitization, reminders)
├── integration/    # harness self-tests (real app boots under jsdom)
├── regression/     # named historical-bug scenarios (A→B→A privacy, sync
│                   # queue isolation, shared-calendar roles, naming
│                   # collisions, budget isolation)
├── e2e/            # Playwright browser tests + helpers.js
├── fixtures/       # deterministic data builders (events, users, rows)
├── mocks/          # fake-supabase.global.js (shared by Vitest AND Playwright)
└── helpers/        # loadApp.js — the jsdom app harness
scripts/            # check-syntax.js, check-duplicate-ids.js, serve.js
```

## How the harness works (`tests/helpers/loadApp.js`)

Vitest tests do **not** import copies of app code. `AppHarness.boot()`:

1. creates a fresh JSDOM window from the real `index.html`;
2. installs fake IndexedDB (`fake-indexeddb`), restores the harness's
   persistent localStorage snapshot, stubs `fetch`/dialogs;
3. evaluates `tests/mocks/fake-supabase.global.js` **inside** that window, so
   `window.supabase.createClient()` returns the fake client;
4. runs the real, unmodified `script.js` in the same vm context.

Because `script.js` is a classic script, its top-level `function` declarations
are window globals — tests call production functions directly
(`app.window.recurrenceMatches(...)`). Top-level `let`/`const` state is
reached with `app.eval("...")`, which evaluates inside the app realm.

One harness = one simulated device. `harness.reload()` simulates a page
reload (localStorage + IndexedDB + fake cloud persist); a new `AppHarness()`
is a fresh device. `app.advanceClock(ms)` skews `Date.now()` inside the app
realm to step past wall-clock guards (e.g. the 15-second account-clear
dedupe window).

## How fake Supabase works (`tests/mocks/fake-supabase.global.js`)

A deterministic in-memory implementation of the client surface the app
actually uses: auth (`getSession`, `onAuthStateChange`, `signUp`,
`signInWithPassword`, `signOut`), query builders
(`select/eq/gt/is/in/order/limit/range`, `insert/update/upsert/delete`,
thenable results), `rpc()` (personal-calendar / shared-calendar / invite
RPCs), and realtime channels (`channel().on().subscribe()`,
`removeChannel`).

The **server** object (`server.signIn(email)`, `server.seedRows`,
`server.makeCalendar`, `server.makeSharedEvent`, `server.injectError`,
`server.emitPostgresChange`, `server.activeChannelCount()`, …) drives
scenarios. It emulates RLS-shaped outcomes client-side: cloud-state rows are
per-user, viewers match 0 rows on shared-event UPDATEs, non-members get
`42501` on INSERT.

> **Honesty note:** these tests verify **client behavior** against an
> RLS-shaped backend. They prove nothing about the real Postgres policies —
> database policy verification still requires the SQL health checks in
> `supabase/`.

In Playwright, the same file is served in place of the supabase CDN bundle
(route interception in `tests/e2e/helpers.js`), and `*.supabase.co` plus the
weather API are blocked outright — **no test can ever reach production
Supabase**.

## How fake IndexedDB is reset

Each `AppHarness` owns one `IDBFactory` from `fake-indexeddb`. Booting the
same harness again keeps it (reload semantics); `harness.resetDevice()` or a
new harness gives a clean database. Vitest runs each test file in an
isolated worker, so state can never leak between files.

## How `testMode` works

`index.html?testMode=1` is the only browser test seam. It is read once at
script start (section 00 of `script.js`):

- service-worker registration is skipped (tests need uncached loads);
- `window.__VANGUARD_TEST_MODE__` is set to `true`.

Without the parameter both effects are absent — `tests/e2e/normal-startup.spec.js`
verifies the flag is `undefined` and the SW path is untouched in normal mode.

## Adding tests

**Unit test** — create `tests/unit/<topic>.test.js`:

```js
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppHarness } from "../helpers/loadApp.js";

let harness, app;
beforeAll(async () => { harness = new AppHarness(); app = await harness.boot(); });
afterAll(() => harness.close());

it("does the thing", () => {
  expect(app.window.someProductionFunction("input")).toBe("output");
});
```

**Regression test** — same pattern in `tests/regression/`, but name the file
and the test after the historical bug it prevents, and drive the scenario
through the real production entry points (auth changes, saves, refreshes) —
not by poking internal state into the shape you want to assert.

**Playwright test** — create `tests/e2e/<topic>.spec.js`:

```js
import { test, expect } from "@playwright/test";
import { bootApp } from "./helpers.js";

test("does the thing in a real browser", async ({ page }) => {
  await bootApp(page);            // network locked down + testMode boot
  // drive the UI, assert user-observable outcomes
});
```

## Investigating a CI failure

1. Open the failed *Quality Foundation* run in the GitHub Actions tab.
2. The step name tells you the layer: syntax / ids / vitest / Playwright.
3. Vitest failures print the exact assertion diff in the log; reproduce
   locally with `npm run test:unit` (or `test:regression`).
4. Playwright failures upload a `playwright-artifacts` artifact containing
   screenshots, videos, and traces. Download it and run
   `npx playwright show-trace <trace.zip>` for a full step-by-step replay.
5. The `coverage-report` artifact carries the HTML coverage report.

## Known V1 limitations

- **Database RLS is not tested here.** The fake emulates policy *outcomes*;
  the real policies live in `supabase/` SQL and need their own verification.
- Playwright runs Chromium only (no WebKit/Firefox yet).
- Receipt OCR (Tesseract), Web Push delivery, live weather, and drag
  gesture physics are untested end-to-end (external services / heavy native
  surfaces).
- A few timing-sensitive scenarios rely on real timers; CI gets one retry
  (`vitest.config.js`) to absorb slow-runner jitter.
- jsdom cannot exercise canvas rendering, real service workers, or layout
  geometry — those paths are covered only by Playwright where feasible.
