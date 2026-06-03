import { describe, it, expect, vi, type Mock } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultsView from "../../src/components/ResultsView";
import { downloadCSV } from "../../src/utils";
import type { Groep, Team, Student, TeamAssessment } from "../../src/types";

// Mock only downloadCSV; keep the rest of utils real.
vi.mock("../../src/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils")>();
  return { ...actual, downloadCSV: vi.fn() };
});

const groep: Groep = {
  id: "g1", name: "BKN-F01", assessoren: [],
  datum: "2026-04-07", startTime: "09:00", endTime: "13:30", slotDuration: 30, pauzes: [],
};
const team: Team = { id: "t1", groepId: "g1", teamNummer: "1", slotTime: "09:00" };
const bart: Student = { id: "sA", groepId: "g1", teamId: "t1", name: "Bart" };

const assess = (scores: Record<number, number>): Record<string, TeamAssessment> => ({
  t1: { teamId: "t1", groepId: "g1", status: "completed", studentAssessments: { sA: { scores, isDuo: {}, notes: {} } } },
});

function renderResults(assessments: Record<string, TeamAssessment>) {
  const props = {
    groepen: [groep], teams: [team], studenten: [bart],
    assessments, onSelectStudentFeedback: vi.fn(),
  } satisfies ComponentProps<typeof ResultsView>;
  render(<ResultsView {...props} />);
  return props;
}

describe("ResultsView — pass/fail logic", () => {
  it("marks a fully-scored student with one Onder as Gezakt despite a passing grade", () => {
    // 1 + 4*5 = 21 points -> cijfer 9, but a single "Onder" (1) fails.
    renderResults(assess({ 1: 1, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 }));
    expect(screen.getByText("Gezakt")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument(); // grade still shown
  });

  it("shows Deels / Onvolledig for a partially scored student", () => {
    renderResults(assess({ 1: 2, 2: 2, 3: 2 })); // only 3 of 6
    expect(screen.getByText("Deels")).toBeInTheDocument();
    expect(screen.getByText("Onvolledig")).toBeInTheDocument();
  });

  it("marks a fully-scored student with no Onder as Geslaagd", () => {
    renderResults(assess({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }));
    expect(screen.getByText("Geslaagd")).toBeInTheDocument();
  });
});

describe("ResultsView — CSV export", () => {
  it("builds a row with name, six scores, total, grade and status", async () => {
    const user = userEvent.setup();
    renderResults(assess({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 })); // total 12 -> 6, geslaagd
    await user.click(screen.getByRole("button", { name: /Exporteer/ }));

    expect(downloadCSV as Mock).toHaveBeenCalledTimes(1);
    const [, rows] = (downloadCSV as Mock).mock.calls[0];
    const row = rows[0] as string[];
    expect(row[0]).toBe("Bart");
    expect(row).toContain("GESLAAGD");
    expect(row).toContain("12"); // total points
    expect(row).toContain("6");  // cijfer
  });
});
