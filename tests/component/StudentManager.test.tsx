import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentManager from "../../src/components/StudentManager";
import type { Groep, Team, Student } from "../../src/types";

const group: Groep = {
  id: "g1", name: "BKN-F01", assessoren: [],
  datum: "2026-04-07", startTime: "09:00", endTime: "13:30",
  slotDuration: 30, pauzes: ["12:00"],
};
const teams: Team[] = [
  { id: "t-1", groepId: "g1", teamNummer: "1", slotTime: "09:00" },
  { id: "t-2", groepId: "g1", teamNummer: "2", slotTime: "09:30" },
];

function renderManager(over: Partial<ComponentProps<typeof StudentManager>> = {}) {
  const props = {
    groepen: [group],
    teams,
    studenten: [] as Student[],
    onAddGroep: vi.fn(),
    onDeleteGroep: vi.fn(),
    onAddTeamsBulk: vi.fn(),
    onDeleteTeam: vi.fn(),
    onAddStudent: vi.fn(),
    onDeleteStudent: vi.fn(),
    ...over,
  };
  render(<StudentManager {...props} />);
  return props;
}

beforeEach(() => {
  vi.stubGlobal("confirm", () => true);
  vi.stubGlobal("alert", () => {});
});
afterEach(() => vi.unstubAllGlobals());

describe("StudentManager — create group", () => {
  it("normalizes the payload (uppercase name, empty assessoren by default, defaults)", async () => {
    const user = userEvent.setup();
    const props = renderManager({ groepen: [] });

    await user.type(screen.getByPlaceholderText("Voorbeeld: BKN-F03"), "bkn-f09");
    await user.click(screen.getByRole("button", { name: "Voeg Groep Toe" }));

    expect(props.onAddGroep).toHaveBeenCalledTimes(1);
    expect(props.onAddGroep).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^g-/),
        name: "BKN-F09",
        assessoren: [],
        datum: "2026-04-07",
        startTime: "09:00",
        endTime: "13:30",
        slotDuration: 30,
        pauzes: ["12:00"],
      })
    );
  });

  it("does not submit when the group name is blank", async () => {
    const user = userEvent.setup();
    const props = renderManager({ groepen: [] });
    await user.click(screen.getByRole("button", { name: "Voeg Groep Toe" }));
    expect(props.onAddGroep).not.toHaveBeenCalled();
  });
});

describe("StudentManager — add student", () => {
  it("disables submit until name and team are chosen, then emits the student", async () => {
    const user = userEvent.setup();
    const props = renderManager();

    const submit = screen.getByRole("button", { name: "Voeg Student Toe" });
    expect(submit).toBeDisabled(); // group preselected, but no name/team yet

    await user.type(screen.getByPlaceholderText("Bijv. voornaam student"), "Testnaam");
    expect(submit).toBeDisabled(); // still no team

    const teamSelect = screen.getByRole("option", { name: "Team 1 (09:00)" }).closest("select")!;
    await user.selectOptions(teamSelect, "Team 1 (09:00)");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(props.onAddStudent).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.stringMatching(/^s-/), name: "Testnaam", groepId: "g1", teamId: "t-1" })
    );
  });
});

describe("StudentManager — bulk teams", () => {
  it("emits the selected group and count", async () => {
    const user = userEvent.setup();
    const props = renderManager();
    // Group is preselected; default count is 5.
    await user.click(screen.getByRole("button", { name: "Genereer Teams Bulk" }));
    expect(props.onAddTeamsBulk).toHaveBeenCalledWith("g1", 5);
  });
});

describe("StudentManager — delete group", () => {
  it("calls onDeleteGroep after confirmation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", () => true);
    const props = renderManager();
    await user.click(screen.getByTitle("Verwijder groep"));
    expect(props.onDeleteGroep).toHaveBeenCalledWith("g1");
  });

  it("does nothing when confirmation is declined", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", () => false);
    const props = renderManager();
    await user.click(screen.getByTitle("Verwijder groep"));
    expect(props.onDeleteGroep).not.toHaveBeenCalled();
  });
});
