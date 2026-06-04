import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GespreksscriptModal from "../../src/components/GespreksscriptModal";
import { CRITERIA } from "../../src/types";
import { GESPREKSSCRIPT } from "../../src/gespreksscript";

function renderModal(onClose = vi.fn()) {
  render(
    <GespreksscriptModal
      students={[{ id: "sA", name: "Bart" }, { id: "sB", name: "Lisa" }]}
      klas="BKN-F01"
      datum="2026-04-07"
      teamNummer="1"
      assessoren={["Docent X"]}
      onClose={onClose}
    />
  );
  return onClose;
}

beforeEach(() => {
  vi.stubGlobal("print", vi.fn()); // jsdom heeft geen window.print
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GespreksscriptModal", () => {
  it("toont de context, alle zes criteria en de startvragen", () => {
    renderModal();
    expect(screen.getByText("PROMEF Assessment — Gespreksscript")).toBeInTheDocument();
    expect(screen.getByText(/BKN-F01/)).toBeInTheDocument();

    for (const crit of CRITERIA) {
      expect(screen.getByText(`${crit.id}. ${crit.title}`)).toBeInTheDocument();
    }
    // Eerste startvraag staat letterlijk (met aanhalingstekens) in het script
    const eersteStart = GESPREKSSCRIPT.criteria[0].startvraag;
    expect(screen.getByText(`“${eersteStart}”`)).toBeInTheDocument();
  });

  it("print via window.print bij klik op 'Bewaar als PDF / Print'", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /Bewaar als PDF/ }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("sluit via de sluitknop en via Escape", () => {
    const onClose = renderModal();
    fireEvent.click(screen.getByRole("button", { name: /Sluiten/ }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
