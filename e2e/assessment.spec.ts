import { test, expect } from "@playwright/test";

// F5 E2E sub-journey: load the demo cohort from public/demo.csv, open the solo
// team (Noah), score all six criteria, and verify the calendar card flips to
// "Voltooid". The app now starts empty, so the demo must be loaded first.
test("scoring all criteria marks the team completed", async ({ page }) => {
  // The "Laad Voorbeeldset" button shows a success alert; auto-accept it.
  page.on("dialog", (d) => d.accept());

  await page.goto("/");

  // Load the demo roster from the Dataset & Import tab.
  await page.getByRole("button", { name: /Dataset & Import/ }).click();
  await page.getByRole("button", { name: "Laad Voorbeeldset" }).click();

  // Back to the calendar and open Noah's solo assessment.
  await page.getByRole("button", { name: /Kalenderoverzicht/ }).click();
  await page.getByText("Noah").click();
  await expect(page.getByRole("button", { name: "C1" })).toBeVisible();

  // Score every criterion "Op".
  for (let c = 1; c <= 6; c++) {
    await page.getByRole("button", { name: `C${c}`, exact: true }).click();
    await page.getByRole("button", { name: "Op", exact: true }).click();
  }

  // Finish -> back to the calendar.
  await page.getByRole("button", { name: /Afronden naar Kalender/ }).click();

  // The team card now shows the completed status. parseCSV derives the team id
  // as t-<groepId>-<teamNummer> -> Noah is BKN-F02 team 4.
  await expect(page.locator("#team-card-t-g-bknf02-4")).toContainText("Voltooid");
});
