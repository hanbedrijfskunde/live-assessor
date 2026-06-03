import { describe, it, expect, afterEach, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeedbackView from "../../src/components/FeedbackView";
import type { Groep, Team, Student, TeamAssessment } from "../../src/types";

const groep: Groep = {
  id: "g1", name: "BKN-F01", assessoren: [],
  datum: "2026-04-07", startTime: "09:00", endTime: "13:30", slotDuration: 30, pauzes: [],
};
const team: Team = { id: "t1", groepId: "g1", teamNummer: "1", slotTime: "09:00" };
const bart: Student = { id: "sA", groepId: "g1", teamId: "t1", name: "Bart" };

const make = (scores: Record<number, number>, notes: Record<number, string> = {}): Record<string, TeamAssessment> => ({
  t1: { teamId: "t1", groepId: "g1", status: "completed", studentAssessments: { sA: { scores, isDuo: {}, notes } } },
});

function renderFeedback(assessments: Record<string, TeamAssessment>) {
  const props = {
    groepen: [groep], teams: [team], studenten: [bart],
    assessments, initialStudentId: "sA", onNavigateBack: vi.fn(),
  } satisfies ComponentProps<typeof FeedbackView>;
  render(<FeedbackView {...props} />);
  return props;
}

afterEach(() => vi.unstubAllGlobals());

describe("FeedbackView — notes parsing", () => {
  it("splits '✓ tag' lines from free text and shows the level badge", () => {
    renderFeedback(
      make(
        { 1: 3, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
        { 1: "✓ theorie correct\n✓ helder uitgelegd\nGoede onderbouwing." }
      )
    );
    expect(screen.getByText("theorie correct")).toBeInTheDocument();
    expect(screen.getByText("helder uitgelegd")).toBeInTheDocument();
    expect(screen.getByText("Goede onderbouwing.")).toBeInTheDocument();
    expect(screen.getByText("Boven niveau")).toBeInTheDocument(); // criterium 1 = score 3
  });
});

describe("FeedbackView — result block", () => {
  it("shows GESLAAGD for a fully scored student with no Onder", () => {
    renderFeedback(make({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }));
    expect(screen.getByText("GESLAAGD")).toBeInTheDocument();
  });

  it("shows GEZAKT when any criterion is Onder", () => {
    renderFeedback(make({ 1: 1, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 }));
    expect(screen.getByText(/GEZAKT/)).toBeInTheDocument();
  });
});

describe("FeedbackView — print", () => {
  it("calls window.print when the export button is clicked", async () => {
    const user = userEvent.setup();
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);

    renderFeedback(make({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }));
    await user.click(screen.getByRole("button", { name: /Exporteer naar PDF/ }));
    expect(printMock).toHaveBeenCalledTimes(1);
  });
});
