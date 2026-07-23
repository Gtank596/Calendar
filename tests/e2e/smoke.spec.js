// Browser smoke: the app loads clean, core navigation works, no duplicate
// ids exist in the live DOM.

import { test, expect } from "@playwright/test";
import { bootApp, expectNoDuplicateIdsLive } from "./helpers.js";

test("app loads without uncaught page errors", async ({ page }) => {
  const errors = await bootApp(page);
  await page.waitForTimeout(1500); // let async init settle
  expect(errors).toEqual([]);
});

test("no duplicate ids in the live, post-JavaScript DOM", async ({ page }) => {
  await bootApp(page);
  await expectNoDuplicateIdsLive(page, expect);
});

test("month / week / day navigation", async ({ page }) => {
  await bootApp(page);

  await expect(page.locator("#monthLabel")).not.toHaveText("");

  // Week view
  await page.click("#weekViewBtn");
  await expect(page.locator("#weekViewBtn")).toHaveClass(/active/);
  // Day view
  await page.click("#dayViewBtn");
  await expect(page.locator("#dayViewBtn")).toHaveClass(/active/);
  // Back to month
  await page.click("#monthViewBtn");
  await expect(page.locator("#monthViewBtn")).toHaveClass(/active/);
  await expect(page.locator("#grid .day").first()).toBeVisible();

  // Prev / Today / Next month arrows change the label
  const label = await page.locator("#monthLabel").textContent();
  await page.click("#nextBtn");
  await expect(page.locator("#monthLabel")).not.toHaveText(label);
  await page.click("#todayBtn");
  await expect(page.locator("#monthLabel")).toHaveText(label);
});

test("section switching: budget and weather sections open", async ({ page }) => {
  await bootApp(page);
  await page.click("#budgetSectionBtn");
  await expect(page.locator("#budgetSectionBtn")).toHaveClass(/active/);
  await expect(page.locator("#budgetTxTitle")).toBeVisible();
  await page.click("#calendarSectionBtn");
  await expect(page.locator("#calendarSectionBtn")).toHaveClass(/active/);
});

test("settings menu opens", async ({ page }) => {
  await bootApp(page);
  await page.click("#settingsBtn");
  // The settings surface should reveal at least one visible checkbox control.
  const anyToggle = page.locator(".settingsMenu input[type=checkbox], #settingsMenu input[type=checkbox]");
  await expect(anyToggle.first()).toBeVisible();
});
