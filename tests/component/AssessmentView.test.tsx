import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssessmentView from "../../src/components/AssessmentView";
import type { Groep, Team, Student, TeamAssessment } from "../../src/types";

const groep: Groep = {
  id: "g1", name: "BKN-F01", assessoren: [],
  datum: "2026-04-07", startTime: "09:00", endTime: "13:30", slotDuration: 30, pauzes: ["12:00"],
};
const team: Team = { id: "t1", groepId: "g1", teamNummer: "1", slotTime: "09:00" };
const bart: Student = { id: "sA", groepId: "g1", teamId: "t1", name: "Bart" };
const lisa: Student = { id: "sB", groepId: "g1", teamId: "t1", name: "Lisa" };

function renderView(over: Partial<ComponentProps<typeof AssessmentView>> = {}) {
  const props = {
    team,
    groep,
    studenten: [bart], // solo by default
    assessment: undefined as TeamAssessment | undefined,
    onSaveAssessment: vi.fn(),
    onNavigateBack: vi.fn(),
    ...over,
  };
  render(<AssessmentView {...props} />);
  return props;
}

// Last assessment handed to onSaveAssessment.
const lastSaved = (fn: ReturnType<typeof vi.fn>): TeamAssessment => fn.mock.calls.at(-1)![0];

const fullScores = (vals: Record<number, number>): TeamAssessment["studentAssessments"][string] =>
  ({ scores: vals, isDuo: {}, notes: {} });

beforeEach(() => {
  vi.stubGlobal("confirm", () => true);
});
afterEach(() => vi.unstubAllGlobals());

describe("AssessmentView — scoring & status", () => {
  it("sets a score and marks the assessment partial", async () => {
    const user = userEvent.setup();
    const props = renderView();
    await user.click(screen.getByRole("button", { name: "Boven" })); // criterium 1 (default tab)
    const saved = lastSaved(props.onSaveAssessment);
    expect(saved.studentAssessments.sA.scores[1]).toBe(3); // Boven = 3
    expect(saved.status).toBe("partial");
  });

  it("becomes completed when the final criterion is scored", async () => {
    const user = userEvent.setup();
    const props = renderView({
      assessment: {
        teamId: "t1", groepId: "g1", status: "partial",
        studentAssessments: { sA: fullScores({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 }) },
      },
    });
    await user.click(screen.getByRole("button", { name: "C6" }));
    await user.click(screen.getByRole("button", { name: "Op" }));
    const saved = lastSaved(props.onSaveAssessment);
    expect(saved.studentAssessments.sA.scores[6]).toBe(2);
    expect(saved.status).toBe("completed");
  });

  it("drops back to partial when a score is cleared", async () => {
    const user = userEvent.setup();
    const props = renderView({
      assessment: {
        teamId: "t1", groepId: "g1", status: "completed",
        studentAssessments: { sA: fullScores({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }) },
      },
    });
    // Criterium 1 already "Op"; clicking it again toggles it off.
    await user.click(screen.getByRole("button", { name: "Op" }));
    const saved = lastSaved(props.onSaveAssessment);
    expect(saved.studentAssessments.sA.scores[1]).toBeUndefined();
    expect(saved.status).toBe("partial");
  });
});

describe("AssessmentView — duo score", () => {
  it("replicates student 1's score to the duo and disables the synced field", async () => {
    const user = userEvent.setup();
    const props = renderView({ studenten: [bart, lisa] });

    // Score Bart (first card) Boven, then turn on Duo-score for criterium 1.
    await user.click(screen.getAllByRole("button", { name: "Boven" })[0]);
    await user.click(screen.getByLabelText("Duo-score"));

    const saved = lastSaved(props.onSaveAssessment);
    expect(saved.studentAssessments.sA.scores[1]).toBe(3);
    expect(saved.studentAssessments.sB.scores[1]).toBe(3); // replicated
    expect(saved.studentAssessments.sA.isDuo[1]).toBe(true);

    // Lisa's (second card) level buttons are now disabled.
    expect(screen.getAllByRole("button", { name: "Boven" })[1]).toBeDisabled();
  });
});

describe("AssessmentView — observation tags", () => {
  it("toggles a '✓ tag' line into and out of the notes (solo)", async () => {
    const user = userEvent.setup();
    const props = renderView();

    await user.click(screen.getByRole("button", { name: /theorie correct/ }));
    expect(lastSaved(props.onSaveAssessment).studentAssessments.sA.notes[1]).toContain("✓ theorie correct");

    await user.click(screen.getByRole("button", { name: /theorie correct/ }));
    expect(lastSaved(props.onSaveAssessment).studentAssessments.sA.notes[1]).not.toContain("✓ theorie correct");
  });
});

describe("AssessmentView — per-student reset", () => {
  it("wipes one student and leaves the team-mate untouched", async () => {
    const user = userEvent.setup();
    const props = renderView({
      studenten: [bart, lisa],
      assessment: {
        teamId: "t1", groepId: "g1", status: "completed",
        studentAssessments: {
          sA: { scores: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 }, isDuo: {}, notes: { 1: "goed" } },
          sB: { scores: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }, isDuo: {}, notes: { 1: "ok" } },
        },
      },
    });

    await user.click(screen.getByTitle("Volledige beoordeling van Bart wissen en opnieuw beginnen"));
    const saved = lastSaved(props.onSaveAssessment);
    expect(saved.studentAssessments.sA).toEqual({ scores: {}, isDuo: {}, notes: {} });
    expect(saved.studentAssessments.sB.scores[1]).toBe(2); // untouched
  });

  it("disables reset when the student has nothing to wipe", () => {
    renderView(); // solo, empty assessment
    expect(screen.getByTitle("Volledige beoordeling van Bart wissen en opnieuw beginnen")).toBeDisabled();
  });
});
