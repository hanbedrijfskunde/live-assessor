import { test, expect } from "@playwright/test";

// F11 end-to-end journeys through the real app. The app starts empty, so each
// journey sets up its own data. Alerts/confirms are auto-accepted.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
});

// Reis 2 — manage a cohort and see it on the calendar.
test("create a group with teams and a student, then see them on the calendar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Studenten/ }).click();

  // New group.
  await page.getByPlaceholder("Voorbeeld: BKN-F03").fill("BKN-TEST");
  await page.getByRole("button", { name: "Voeg Groep Toe" }).click();

  // Bulk-create 2 teams for it.
  await page.locator('select:has(option:text-is("-- Kies Groep --"))').selectOption({ label: "BKN-TEST" });
  await page.locator('input[type="number"]').fill("2");
  await page.getByRole("button", { name: "Genereer Teams Bulk" }).click();

  // Add a student to team 1.
  await page.getByPlaceholder("Bijv. voornaam student").fill("TestStudent");
  await page.locator('select:has(option:text-is("-- Kies --"))').selectOption({ label: "BKN-TEST" });
  await page.locator('select:has(option:text-is("-- Kies team --"))').selectOption({ index: 1 });
  await page.getByRole("button", { name: "Voeg Student Toe" }).click();

  // Calendar shows the group, a team card and the student.
  await page.getByRole("button", { name: /Kalenderoverzicht/ }).click();
  await expect(page.getByText("BKN-TEST")).toBeVisible();
  await expect(page.getByText("TestStudent")).toBeVisible();
  await expect(page.getByText("Team 1")).toBeVisible();
});

// Reis 3 — AI simulation "Alles onvoldoende" applied -> student fails in the matrix.
test("applying an 'onvoldoende' simulation marks the student Gezakt", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Dataset & Import/ }).click();
  await page.getByRole("button", { name: "Laad Voorbeeldset" }).click();

  await page.getByRole("button", { name: /Kalenderoverzicht/ }).click();
  await page.getByText("Noah").click(); // solo team

  await page.getByRole("button", { name: /Alles onvoldoende/ }).click();
  // Playback runs ~9s; the apply button appears when the analysis is ready.
  const apply = page.getByRole("button", { name: /Gebruik AI Suggesties/ });
  await expect(apply).toBeVisible({ timeout: 20000 });
  await apply.click();

  await page.getByRole("button", { name: /Resultatenmatrix/ }).click();
  await page.locator('select:has(option:text-is("BKN-F02"))').selectOption({ label: "BKN-F02" });
  // exact:true avoids matching the legend paragraph that contains "gezakt".
  await expect(page.getByText("Gezakt", { exact: true })).toBeVisible();
});

// Reis 4 — import a cohort, then wipe it.
test("import demo cohort then reset wipes the app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Dataset & Import/ }).click();
  await page.getByRole("button", { name: "Laad Voorbeeldset" }).click();

  await page.getByRole("button", { name: /Kalenderoverzicht/ }).click();
  await expect(page.getByText("BKN-F01")).toBeVisible();

  await page.getByRole("button", { name: /Dataset & Import/ }).click();
  await page.getByRole("button", { name: /Volledige Reset/ }).click();

  await page.getByRole("button", { name: /Kalenderoverzicht/ }).click();
  await expect(page.getByText(/Geen assessment data ingeladen/)).toBeVisible();
});
