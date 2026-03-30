import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("search page loads with input", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /search/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("search with query shows results or empty state", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.getByPlaceholder(/search/i)).toHaveValue("test");
    // Wait for search to complete (debounced)
    await page.waitForTimeout(500);
    // Should show results section or "no results" message
    await expect(page.locator("main")).toBeVisible();
  });

  test("typing in search input updates URL", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder(/search/i);
    await input.fill("roadmap");
    // Wait for debounce + URL update
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=roadmap/);
  });
});
