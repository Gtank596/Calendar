# Quality Foundation V1 — Implementation Record

Date: 2026-07-22
Scope: permanent test suite, static checks, coverage, and CI for Vanguard
Calendar. The production app remains a static, no-build vanilla PWA.

## What was implemented

- **Vitest** unit + integration + regression suites (104 tests in 12 files)
  that boot the **real, unmodified `script.js`** inside jsdom vm contexts
  (`tests/helpers/loadApp.js`) — no production logic is duplicated in tests.
- **Deterministic fake Supabase** (`tests/mocks/fake-supabase.global.js`):
  auth, query builders, upsert/soft-delete, RPCs, realtime channels, error
  injection, offline mode, and client-side RLS-outcome emulation. One
  implementation serves both Vitest (evaluated in-window) and Playwright
  (served in place of the CDN bundle).
- **Fake IndexedDB** via `fake-indexeddb`, one factory per simulated device,
  persistent across simulated reloads.
- **Playwright** browser suite (14 tests in 5 files): smoke/navigation,
  event CRUD + recurrence + search, budget transaction UI, IndexedDB
  persistence across reload, personal/shared isolation, in-browser A→B→A
  privacy drill, normal-startup seam inertness, offline app-shell via the
  real service worker. All Supabase/weather traffic is blocked at the
  network layer.
- **Static checks**: `scripts/check-syntax.js` (parse-goal-aware
  `node --check` over 28 first-party JS files) and
  `scripts/check-duplicate-ids.js` (jsdom-parsed duplicate-id detection,
  252 unique ids verified).
- **Coverage**: V8 provider. Because the harness runs `script.js` with its
  real filename in vm contexts, coverage attributes directly to
  `script.js`.
- **CI**: `.github/workflows/test.yml` (PRs, pushes to main, manual
  dispatch) — npm ci → syntax → ids → coverage → Playwright, with failure
  artifacts (traces/screenshots/videos) and coverage uploads. No secrets
  required.
- **Docs**: `TESTING.md` (how to run/extend/debug) and this file.

## Files added

```
package.json  package-lock.json  vitest.config.js  playwright.config.js
scripts/check-syntax.js  scripts/check-duplicate-ids.js  scripts/serve.js
tests/helpers/loadApp.js
tests/mocks/fake-supabase.global.js
tests/fixtures/index.js
tests/integration/harness-boot.test.js
tests/unit/{dates-and-time,recurrence,quickadd,budget,shared-sanitization,reminders}.test.js
tests/regression/{account-privacy-aba,sync-queue-isolation,shared-calendars,naming-collisions,budget-isolation}.test.js
tests/e2e/{helpers.js,smoke.spec.js,events.spec.js,budget-and-persistence.spec.js,account-privacy.spec.js,normal-startup.spec.js}
.github/workflows/test.yml
TESTING.md  QUALITY-FOUNDATION-V1.md
```

## Production files changed

1. **`script.js`** — three changes:
   - **Test seam (section 00, new):** `?testMode=1` skips service-worker
     registration and sets `window.__VANGUARD_TEST_MODE__`. Inert without
     the URL parameter (verified by `normal-startup.spec.js`).
   - **Bug fix — recurrence DST drift:** `recurrenceMatches` computed week
     counts with `Math.floor((targetDt - startDt) / 86400000)`; across a DST
     spring-forward the 7-day gap is ~6.96 days, so `floor` under-counted and
     weekly series with interval > 1 shifted a week after the DST change
     (found by `tests/unit/recurrence.test.js`). Fixed with `Math.round` in
     both the `weekly` and `weeklyDays` branches.
   - **Bug fix — budget drawer stale list:** adding/updating a transaction
     re-rendered the budget page while the IndexedDB `budgetTransactions`
     store still held the pre-add state (its write is debounced), so the
     range-cache hydration pinned a stale empty list that nothing re-rendered
     (found by `budget-and-persistence.spec.js`). The drawer paths now flush
     the pending IndexedDB slice writes, then invalidate the budget range
     cache and re-render.
2. **`service-worker.js`** — cache version bump `v27 → v28` (required by the
   `script.js` changes; caching behavior unchanged, Supabase never cached).

No other production file changed. `index.html`, `style.css`, `manifest.json`
are untouched.

## Testability seams introduced

| Seam | Guard | Effect when inactive |
|---|---|---|
| `?testMode=1` URL parameter | read once at script start | none — flag absent, SW registers normally |
| `window.__VANGUARD_TEST_MODE__` | only set in test mode | undefined |

That is the complete list. No `window.__VANGUARD_TEST_API__` was needed:
`script.js` is a classic script, so its top-level functions are already
window globals in both jsdom and real browsers.

## Named regressions now protected

1. **A→B→A account privacy** (`account-privacy-aba.test.js`, plus the
   in-browser version in `account-privacy.spec.js`): logout scrubs
   localStorage/IndexedDB/memory; B can't see or replay A; A's re-login
   takes the cleared-baseline forced FULL pull and restores events with no
   manual Pull; pre-first-login offline data is still adopted.
2. **Sync-queue replay across accounts** (`sync-queue-isolation.test.js`):
   queued ops die at logout; nothing of A uploads under B; delta pulls can't
   cross accounts; empty local baselines never overwrite cloud; tombstones
   beat stale known-record re-upserts.
3. **Shared-calendar roles and isolation** (`shared-calendars.test.js`):
   viewer edits match 0 rows (conflict path) while editors succeed with a
   version bump; stale optimistic versions are detected, never overwritten;
   `kind="personal"` mirrors are excluded from every writable destination;
   shared events never enter personal storage/undo/reminders/budget/IndexedDB;
   realtime channels are never duplicated and are disposed at logout.
4. **Global-wrapper recursion** (`naming-collisions.test.js`): public
   `window.refreshSharedCalendars` provably delegates to
   `refreshSharedCalendarsCore`; a static scan freezes the pre-existing
   duplicate top-level declarations (`clamp`, `closeBudgetInsightsMenu`,
   `pad2`) so any NEW silent global override fails CI.
5. **Budget/receipt privacy** (`budget-isolation.test.js`): mirror rows are
   field-whitelisted (no price/reminder/receipt/merchant data); budget-origin
   events are never mirrored (Hard Rule 7); shared events can't touch budget
   totals or IndexedDB budget stores; receipt/merchant learning keys are
   account-scoped and cleared on switch.
6. **Recurrence DST drift** (`recurrence.test.js`): the fixed bug above
   stays fixed.

## Coverage baseline (truthful V1 numbers)

Full Vitest run (`npm run test:coverage`), V8 provider:

- **`script.js` (21.3k lines of production code): ~43.6% statements /
  ~68% branches / ~48% functions.** These are real numbers against the real
  file — the harness executes `script.js` with its actual filename, so V8
  attributes coverage correctly.
- Rendering-heavy sections (month/week DOM layout, drag ghosts, receipt OCR
  UI) dominate the uncovered remainder; the storage/sync/privacy/recurrence
  logic paths are the well-covered part.
- No thresholds are enforced in V1. The number is a baseline to grow, not a
  gate; the CI gate is the 118 behavioral tests. Coverage cannot silently
  collapse without the coverage step failing outright (it runs on every CI
  pass and the report is uploaded).

## CI behavior

`.github/workflows/test.yml`, on PRs / pushes to main / manual dispatch:
checkout → Node 18 with npm cache → `npm ci` → `check:syntax` →
`check:ids` → `test:coverage` (coverage artifact) → Playwright install →
`test:e2e` (12-minute step timeout, failure artifacts). Any failed step
fails the run. No secrets.

Node is pinned to 18 on purpose: it matches the verified local toolchain,
and the first CI run proved Playwright 1.49.1 hangs silently under the
runner's Node 24 (29 minutes of no output until the job cap). Bump Node and
Playwright together when upgrading either.

## Checks run for this change (all passing)

- `npm ci` — clean install from the committed lockfile
- `npm run check:syntax` — 28 files, 0 failures
- `npm run check:ids` — 252 unique ids, 0 duplicates
- `npm run test:unit` — 78 passed
- `npm run test:regression` — 26 passed
- `npm run test:coverage` — 104 passed, coverage above
- `npm run test:e2e` — 14 passed
- `npm run test:ci` — full sequence green
- Manual smoke: ordinary app (no testMode, real supabase CDN) served
  locally — renders, zero console errors, seam flag absent, SW path active.

## Remaining untested risks

- Real Supabase RLS policies, triggers, and Edge Functions (fake covers
  client behavior only).
- Web Push end-to-end delivery; receipt OCR accuracy; live weather.
- Drag/resize pointer physics and visual layout regressions.
- Cross-browser behavior (Chromium only in V1).
- The GitHub Actions workflow was hardened after its first live run (Node
  pinned to 18, Playwright step timeout) — see "CI behavior" above.

## Rollback

- **Full rollback:** restore the dated snapshot
  `C:\Users\gabri\OneDrive\Desktop\B_up_Calendars\B-up calendar_7-22-2026_pre-quality-foundation\`
  (complete pre-change copy), or `git revert` the commit.
- **Production-only rollback:** revert `script.js` and `service-worker.js`;
  everything else is inert development tooling (deleting `tests/`,
  `scripts/`, the configs, `package.json`/lockfile, and the workflow
  restores the pre-V1 repo exactly).
- The three `script.js` changes are independent: the seam (section 00 + one
  condition at SW registration), the DST fix (two `Math.round` lines), and
  the budget-drawer flush block can each be reverted alone. Any `script.js`
  revert should bump the SW cache version again.

## Deployment order

1. Push this commit (app + tooling together — tooling is inert in
   production).
2. Cloudflare/static host redeploys `index.html`/`script.js`/
   `service-worker.js`; clients re-cache on next visit via the v28 SW.
3. No SQL, no secrets, no Supabase changes required.
