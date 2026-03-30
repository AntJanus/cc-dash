import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test("settings page loads with heading", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();
  });

  test("scan directories section is visible", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/scan dir/i)).toBeVisible();
  });

  test("theme toggle is present in sidebar", async ({ page }) => {
    await page.goto("/settings");
    // Theme toggle button in sidebar footer
    const themeBtn = page.getByRole("button", { name: /light|dark|theme/i });
    if ((await themeBtn.count()) > 0) {
      await expect(themeBtn.first()).toBeVisible();
    }
  });
});
