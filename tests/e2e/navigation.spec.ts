import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /projects/i }),
    ).toBeVisible();
  });

  test("sidebar shows navigation links", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("nav");
    await expect(sidebar.getByText("All Projects")).toBeVisible();
    await expect(sidebar.getByText("Ideas")).toBeVisible();
    await expect(sidebar.getByText("Activity")).toBeVisible();
    await expect(sidebar.getByText("Settings")).toBeVisible();
  });

  test("navigate to Ideas page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ideas/i }).first().click();
    await page.waitForURL("**/ideas");
    await expect(
      page.getByRole("heading", { name: /project ideas/i }),
    ).toBeVisible();
  });

  test("navigate to Activity page", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /activity/i })
      .first()
      .click();
    await page.waitForURL("**/activity");
    await expect(
      page.getByRole("heading", { name: /activity/i }),
    ).toBeVisible();
  });

  test("navigate to Settings page", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /settings/i })
      .first()
      .click();
    await page.waitForURL("**/settings");
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();
  });

  test("navigate to Search page", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /search/i })
      .first()
      .click();
    await page.waitForURL("**/search");
    await expect(page.getByRole("heading", { name: /search/i })).toBeVisible();
  });
});
