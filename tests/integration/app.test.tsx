import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

// Integration tests exercise App + its views + the localStorage persistence
// layer together. jsdom's localStorage is unreliable under Vitest, so we back
// the global with an in-memory Storage and reset it per test.
function makeStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("confirm", () => true);
  vi.stubGlobal("alert", () => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const readLS = (key: string) => JSON.parse(localStorage.getItem(key) || "null");

describe("App shell", () => {
  it("loads seed data on mount and renders the calendar dashboard", async () => {
    render(<App />);
    // Seed groups appear on the default dashboard view.
    expect(await screen.findByText("BKN-F01")).toBeInTheDocument();
    expect(screen.getByText("BKN-F02")).toBeInTheDocument();
    // Statistics tile reflects the seeded teams.
    expect(screen.getByText("Totaal Deelnemende Teams")).toBeInTheDocument();
  });

  it("navigates between the main tabs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("BKN-F01");

    await user.click(screen.getByRole("button", { name: /Studenten/ }));
    expect(await screen.findByText("Nieuwe Klas / Groep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Resultatenmatrix/ }));
    expect(await screen.findByText("Selecteer Klas:")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Dataset & Import/ }));
    expect(await screen.findByText("CSV Deelnemers Import")).toBeInTheDocument();
  });

  it("cascade-deletes a group with its teams, students and assessments", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("BKN-F01");

    await user.click(screen.getByRole("button", { name: /Studenten/ }));
    await screen.findByText("Geregistreerde Groepen & Deelnemers");

    // Two groups => two "Verwijder groep" buttons; delete the first (BKN-F01).
    const deleteButtons = screen.getAllByTitle("Verwijder groep");
    expect(deleteButtons).toHaveLength(2);
    await user.click(deleteButtons[0]);

    // UI: only one group-delete button remains.
    await waitFor(() =>
      expect(screen.getAllByTitle("Verwijder groep")).toHaveLength(1)
    );

    // Persistence: g-f01 and its teams/students/assessments are gone.
    expect(readLS("promef_groepen").map((g: any) => g.id)).toEqual(["g-f02"]);
    expect(readLS("promef_teams").some((t: any) => t.groepId === "g-f01")).toBe(false);
    expect(readLS("promef_studenten").some((s: any) => s.groepId === "g-f01")).toBe(false);
    // INITIAL_ASSESSMENTS only held t-1 & t-2 (both in g-f01) -> now empty.
    expect(Object.keys(readLS("promef_assessments"))).not.toContain("t-1");
    expect(Object.keys(readLS("promef_assessments"))).not.toContain("t-2");
  });

  it("persists a mutation across an app remount", async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await screen.findByText("BKN-F01");
    await user.click(screen.getByRole("button", { name: /Studenten/ }));
    await screen.findByText("Geregistreerde Groepen & Deelnemers");
    await user.click(screen.getAllByTitle("Verwijder groep")[0]); // delete BKN-F01
    await waitFor(() =>
      expect(screen.getAllByTitle("Verwijder groep")).toHaveLength(1)
    );

    // Remount from scratch — same (stubbed) localStorage backs the reload.
    first.unmount();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Studenten/ }));
    await screen.findByText("Geregistreerde Groepen & Deelnemers");

    // The deleted group did NOT reappear from seed data: one group remains.
    expect(screen.getAllByTitle("Verwijder groep")).toHaveLength(1);
    expect(screen.queryByText("BKN-F01")).not.toBeInTheDocument();
    expect(screen.getAllByText("BKN-F02").length).toBeGreaterThan(0);
  });
});
