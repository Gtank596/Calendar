// Event CRUD, recurrence, and search through the real UI.

import { test, expect } from "@playwright/test";
import { bootApp, quickAdd } from "./helpers.js";

test("create, edit, and delete an event", async ({ page }) => {
  await bootApp(page);

  // CREATE via Quick Add (exercises parser + save pipeline + render).
  await quickAdd(page, "Playwright dentist tomorrow 10am");
  await expect(page.locator("#grid")).toContainText("Playwright dentist");

  // EDIT: select it in the editor via the day cell, change the title, save.
  await page.locator("#grid .day", { hasText: "Playwright dentist" }).first()
    .locator("text=Playwright dentist").first().click();
  const titleInput = page.locator("#eventTitle");
  await expect(titleInput).toHaveValue(/Playwright dentist/);
  await titleInput.fill("Playwright dentist EDITED");
  await page.click("#addBtn");
  await expect(page.locator("#grid")).toContainText("Playwright dentist EDITED");

  // DELETE
  page.once("dialog", (d) => d.accept());
  await page.locator("#grid .day", { hasText: "Playwright dentist EDITED" }).first()
    .locator("text=Playwright dentist EDITED").first().click();
  await page.click("#deleteBtn");
  await expect(page.locator("#grid")).not.toContainText("Playwright dentist EDITED");
});

test("recurring event workflow (weekly pick-days via Quick Add)", async ({ page }) => {
  await bootApp(page);

  await quickAdd(page, "Yoga every mon/wed 6-7pm");
  // The series should render on multiple day cells of the visible month.
  const cells = page.locator("#grid .day", { hasText: "Yoga" });
  await expect
    .poll(async () => cells.count(), { timeout: 10000 })
    .toBeGreaterThan(2);
});

test("search finds a created event", async ({ page }) => {
  await bootApp(page);
  await quickAdd(page, "Searchable sushi night tomorrow 7pm");
  await expect(page.locator("#grid")).toContainText("Searchable sushi");

  await page.click("#searchBtn");
  // Quick search UI is created lazily on first open.
  const box = page.locator("#quickSearchInput");
  await expect(box).toBeVisible();
  await box.fill("sushi");
  await expect(page.locator("#quickSearchResults")).toContainText(/Searchable sushi/);
});
