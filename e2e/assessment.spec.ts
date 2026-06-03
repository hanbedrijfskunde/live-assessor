import { test, expect } from "@playwright/test";

// F5 E2E sub-journey: open a team, score all six criteria, and verify the
// calendar card flips to "Voltooid". Uses the solo team (Noah) from the seed
// data so the journey is one score per criterion.
test("scoring all criteria marks the team completed", async ({ page }) => {
  await page.goto("/");

  // Open Noah's solo assessment from the calendar.
  await page.getByText("Noah").click();
  await expect(page.getByRole("button", { name: "C1" })).toBeVisible();

  // Score every criterion "Op".
  for (let c = 1; c <= 6; c++) {
    await page.getByRole("button", { name: `C${c}`, exact: true }).click();
    await page.getByRole("button", { name: "Op", exact: true }).click();
  }

  // Finish -> back to the calendar.
  await page.getByRole("button", { name: /Afronden naar Kalender/ }).click();

  // The team card now shows the completed status.
  await expect(page.locator("#team-card-t-9")).toContainText("Voltooid");
});
