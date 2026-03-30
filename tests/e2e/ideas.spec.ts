import { test, expect } from "@playwright/test";

test.describe("Ideas Page", () => {
  test("ideas page loads", async ({ page }) => {
    await page.goto("/ideas");
    await expect(
      page.getByRole("heading", { name: /project ideas/i }),
    ).toBeVisible();
  });

  test("shows ideas grid or configuration message", async ({ page }) => {
    await page.goto("/ideas");
    // Either ideas are shown or config message
    const hasIdeas =
      (await page.locator("[class*=interactive-card]").count()) > 0;
    const hasConfigMsg = (await page.getByText(/no ideas file/i).count()) > 0;
    expect(hasIdeas || hasConfigMsg).toBe(true);
  });
});
