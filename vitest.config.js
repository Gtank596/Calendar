import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Each test file gets its own isolated worker: the harness evaluates the
    // real script.js inside fresh jsdom windows, so isolation prevents any
    // cross-file global leakage.
    isolate: true,
    environment: "node", // the harness builds its own jsdom windows explicitly
    include: [
      "tests/unit/**/*.test.js",
      "tests/integration/**/*.test.js",
      "tests/regression/**/*.test.js",
    ],
    exclude: ["tests/e2e/**", "node_modules/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Coverage instrumentation slows the app boot enough to occasionally trip
    // wall-clock-sensitive scenarios; one CI retry absorbs that without hiding
    // a consistently failing test.
    retry: process.env.CI ? 1 : 0,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text-summary", "html", "lcov"],
      include: ["script.js", "tests/helpers/**/*.js", "tests/mocks/**/*.js"],
      // The default excludes swallow tests/** — override them so the harness
      // and fake Supabase count, while test specs/fixtures stay out.
      exclude: [
        "**/node_modules/**",
        "coverage/**",
        "tests/unit/**",
        "tests/integration/**",
        "tests/regression/**",
        "tests/e2e/**",
        "tests/fixtures/**",
      ],
    },
  },
});
