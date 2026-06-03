import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarOverview from "../../src/components/CalendarOverview";
import type { Groep, Team, Student, TeamAssessment } from "../../src/types";

const g = (over: Partial<Groep> = {}): Groep => ({
  id: "g1", name: "BKN-F01", assessoren: ["Sonia", "Mark"],
  datum: "2026-04-07", startTime: "09:00", endTime: "10:30",
  slotDuration: 30, pauzes: [], ...over,
});
const team = (id: string, groepId: string, teamNummer: string, slotTime: string | null): Team =>
  ({ id, groepId, teamNummer, slotTime });
const assessment = (teamId: string, groepId: string, status: TeamAssessment["status"]): TeamAssessment =>
  ({ teamId, groepId, status, studentAssessments: {} });

function renderCal(over: Partial<ComponentProps<typeof CalendarOverview>> = {}) {
  const props = {
    groepen: [g()],
    teams: [] as Team[],
    studenten: [] as Student[],
    assessments: {} as Record<string, TeamAssessment>,
    onSelectTeam: vi.fn(),
    onModifyPauze: vi.fn(),
    onMoveTeam: vi.fn(),
    onNavigateToStudents: vi.fn(),
    ...over,
  };
  const utils = render(<CalendarOverview {...props} />);
  return { ...utils, props };
}

// A dataTransfer stub good enough for the drop handler (reads "text/plain").
const dt = (teamId: string) => ({ getData: () => teamId, setData: () => {} });

describe("CalendarOverview — status badges", () => {
  it("maps assessment status to the right badge", () => {
    renderCal({
      groepen: [g({ startTime: "09:00", endTime: "10:30" })], // slots 09:00, 09:30, 10:00
      teams: [team("t-1", "g1", "1", "09:00"), team("t-2", "g1", "2", "09:30"), team("t-3", "g1", "3", "10:00")],
      assessments: {
        "t-1": assessment("t-1", "g1", "completed"),
        "t-2": assessment("t-2", "g1", "partial"),
        // t-3 has no assessment -> not_started
      },
    });
    expect(screen.getByText("Voltooid")).toBeInTheDocument();
    expect(screen.getByText("Deels beoordeeld")).toBeInTheDocument();
    expect(screen.getByText("Onbeoordeeld")).toBeInTheDocument();
  });
});

describe("CalendarOverview — interactions", () => {
  it("opens the assessment when a team card is clicked", async () => {
    const user = userEvent.setup();
    const { container, props } = renderCal({
      teams: [team("t-1", "g1", "1", "09:00")],
    });
    await user.click(container.querySelector("#team-card-t-1")!);
    expect(props.onSelectTeam).toHaveBeenCalledWith("t-1");
  });

  it("adds a pause when an empty slot is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderCal({
      groepen: [g({ startTime: "09:00", endTime: "09:30" })], // single slot 09:00, empty
    });
    await user.click(screen.getByText("Leeg"));
    expect(props.onModifyPauze).toHaveBeenCalledWith("g1", "09:00", "add");
  });

  it("removes a pause via the ✕ button", async () => {
    const user = userEvent.setup();
    const { props } = renderCal({
      groepen: [g({ startTime: "09:00", endTime: "09:30", pauzes: ["09:00"] })],
    });
    await user.click(screen.getByTitle("Verwijder pauze"));
    expect(props.onModifyPauze).toHaveBeenCalledWith("g1", "09:00", "remove");
  });
});

describe("CalendarOverview — drag & drop", () => {
  it("moves a team when dropped on a slot within the same group", () => {
    const { props } = renderCal({
      groepen: [g({ startTime: "09:00", endTime: "10:00" })], // slots 09:00, 09:30
      teams: [team("t-1", "g1", "1", "09:00")],
    });
    const targetRow = screen.getByText("09:30").parentElement!; // row carries onDrop
    fireEvent.drop(targetRow, { dataTransfer: dt("t-1") });
    expect(props.onMoveTeam).toHaveBeenCalledWith("t-1", "09:30");
  });

  it("ignores a drop onto a different group", () => {
    const { props } = renderCal({
      groepen: [
        g({ id: "g1", name: "BKN-F01", startTime: "09:00", endTime: "10:00" }), // 09:00, 09:30
        g({ id: "g2", name: "BKN-F02", startTime: "10:00", endTime: "10:30" }), // 10:00
      ],
      teams: [team("t-1", "g1", "1", "09:00")],
    });
    const otherGroupRow = screen.getByText("10:00").parentElement!; // belongs to g2
    fireEvent.drop(otherGroupRow, { dataTransfer: dt("t-1") });
    expect(props.onMoveTeam).not.toHaveBeenCalled();
  });
});
