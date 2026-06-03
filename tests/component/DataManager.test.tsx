import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataManager from "../../src/components/DataManager";
import { downloadBackup } from "../../src/utils";

// Mock only downloadBackup; keep parseCSV (and the rest) real.
vi.mock("../../src/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils")>();
  return { ...actual, downloadBackup: vi.fn() };
});

function renderDM() {
  const props = {
    groepen: [{ id: "g1", name: "BKN-F01", assessoren: [], datum: "2026-04-07", startTime: "09:00", endTime: "13:30", slotDuration: 30, pauzes: [] }],
    teams: [{ id: "t1", groepId: "g1", teamNummer: "1", slotTime: "09:00" }],
    studenten: [{ id: "sA", groepId: "g1", teamId: "t1", name: "Bart" }],
    assessments: {},
    onImportData: vi.fn(),
    onRestoreBackup: vi.fn(),
    onLoadExampleData: vi.fn(),
    onResetAllData: vi.fn(),
  } satisfies ComponentProps<typeof DataManager>;
  const utils = render(<DataManager {...props} />);
  return { ...utils, props };
}

// Drop a file into a hidden <input type=file> (userEvent.upload refuses these).
function uploadTo(input: HTMLInputElement, text: string, name: string, type: string) {
  const file = new File([text], name, { type });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

beforeEach(() => {
  vi.stubGlobal("alert", () => {});
  vi.stubGlobal("confirm", () => true);
});
afterEach(() => vi.unstubAllGlobals());

const fileInputs = (c: HTMLElement) => c.querySelectorAll('input[type="file"]'); // [0]=CSV, [1]=JSON

describe("DataManager — CSV import", () => {
  it("imports a valid CSV into groups/teams/students", async () => {
    const { container, props } = renderDM();
    uploadTo(fileInputs(container)[0] as HTMLInputElement, "Student;Groep;Team\nAlfa;BKN-Z;1\nBeta;BKN-Z;1", "roster.csv", "text/csv");
    await waitFor(() => expect(props.onImportData).toHaveBeenCalled());
    const [groups, teams, students] = props.onImportData.mock.calls[0];
    expect(groups[0].name).toBe("BKN-Z");
    expect(teams).toHaveLength(1);
    expect(students).toHaveLength(2);
  });

  it("shows an error banner and does not import an invalid CSV", async () => {
    const { container, props } = renderDM();
    uploadTo(fileInputs(container)[0] as HTMLInputElement, "kolomA;kolomB\n1;2", "bad.csv", "text/csv");
    expect(await screen.findByText(/kolommen/i)).toBeInTheDocument();
    expect(props.onImportData).not.toHaveBeenCalled();
  });
});

describe("DataManager — JSON backup/restore", () => {
  it("exports a backup bundle with all four data slices", async () => {
    const user = userEvent.setup();
    renderDM();
    await user.click(screen.getByRole("button", { name: /Maak Back-up/ }));
    expect(downloadBackup as Mock).toHaveBeenCalledTimes(1);
    const [bundle] = (downloadBackup as Mock).mock.calls[0];
    expect(Object.keys(bundle).sort()).toEqual(["assessments", "groepen", "studenten", "teams"]);
  });

  it("restores a valid backup", async () => {
    const { container, props } = renderDM();
    const backup = JSON.stringify({ groepen: [], teams: [], studenten: [], assessments: {} });
    uploadTo(fileInputs(container)[1] as HTMLInputElement, backup, "backup.json", "application/json");
    await waitFor(() => expect(props.onRestoreBackup).toHaveBeenCalled());
  });

  it("rejects a backup that is missing a required key", async () => {
    const { container, props } = renderDM();
    const broken = JSON.stringify({ groepen: [], teams: [], studenten: [] }); // no assessments
    uploadTo(fileInputs(container)[1] as HTMLInputElement, broken, "broken.json", "application/json");
    expect(await screen.findByText(/Ongeldig back-up/i)).toBeInTheDocument();
    expect(props.onRestoreBackup).not.toHaveBeenCalled();
  });
});

describe("DataManager — reset", () => {
  it("wipes everything after confirmation", async () => {
    const user = userEvent.setup();
    const { props } = renderDM();
    await user.click(screen.getByRole("button", { name: /Volledige Reset/ }));
    expect(props.onResetAllData).toHaveBeenCalledTimes(1);
  });

  it("does nothing when reset is declined", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", () => false);
    const { props } = renderDM();
    await user.click(screen.getByRole("button", { name: /Volledige Reset/ }));
    expect(props.onResetAllData).not.toHaveBeenCalled();
  });
});
