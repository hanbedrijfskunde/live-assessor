import { test, expect } from "@playwright/test";

// F0 smoke: the app boots, mounts React, and the main shell renders.
test("app boots and renders the dashboard @smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.getByText("PROMEF", { exact: false }).first()).toBeVisible();
  // Primary navigation is present.
  await expect(page.getByRole("button", { name: /Kalenderoverzicht/i })).toBeVisible();
});
