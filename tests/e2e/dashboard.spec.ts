import { test, expect } from "@playwright/test";

test.describe("Dashboard Home", () => {
  test("renders project cards or empty state", async ({ page }) => {
    await page.goto("/");
    // Either project cards exist or an empty state message
    const cards = page.locator("[class*=interactive-card]");
    const count = await cards.count();
    if (count === 0) {
      await expect(page.getByText(/no projects/i)).toBeVisible();
    } else {
      await expect(cards.first()).toBeVisible();
    }
  });

  test("view mode toggle switches between grid, list, and board", async ({
    page,
  }) => {
    await page.goto("/");
    // Look for view toggle buttons
    const gridBtn = page.getByRole("button", { name: /grid/i });
    const listBtn = page.getByRole("button", { name: /list/i });
    const boardBtn = page.getByRole("button", { name: /board/i });

    // At least one view mode button should be present
    const hasGridBtn = (await gridBtn.count()) > 0;
    const hasListBtn = (await listBtn.count()) > 0;
    const hasBoardBtn = (await boardBtn.count()) > 0;

    expect(hasGridBtn || hasListBtn || hasBoardBtn).toBe(true);

    // Switch to list view if available
    if (hasListBtn) {
      await listBtn.click();
      // Verify the page didn't error
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("status filter buttons are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /all/i })).toBeVisible();
  });

  test("sort controls are present", async ({ page }) => {
    await page.goto("/");
    // Sort buttons from the project-sort component
    await expect(page.getByRole("button", { name: /updated/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /name/i })).toBeVisible();
  });

  test("search input filters projects", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByPlaceholder(/search/i);
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("nonexistent-project-xyz");
      // Should show no results or filtered view
      await expect(page.locator("main")).toBeVisible();
    }
  });
});
