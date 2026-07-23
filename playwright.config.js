import { defineConfig, devices } from "@playwright/test";

// Playwright browser tests for Vanguard Calendar.
//
// The app is served by the dependency-free static server in scripts/serve.js.
// Every test blocks *.supabase.co and open-meteo at the network layer (see
// tests/e2e/helpers.js), so no test can ever reach production Supabase.

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:8123",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "node scripts/serve.js 8123",
    url: "http://127.0.0.1:8123/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
