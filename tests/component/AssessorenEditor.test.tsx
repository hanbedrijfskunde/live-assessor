import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssessorenEditor from "../../src/components/AssessorenEditor";

describe("AssessorenEditor", () => {
  it("shows existing assessoren as chips", () => {
    render(<AssessorenEditor assessoren={["Anya", "Bram"]} onChange={vi.fn()} />);
    expect(screen.getByText("Anya")).toBeInTheDocument();
    expect(screen.getByText("Bram")).toBeInTheDocument();
  });

  it("shows a placeholder when empty", () => {
    render(<AssessorenEditor assessoren={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Nog geen assessoren")).toBeInTheDocument();
  });

  it("adds a trimmed name via the + button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya"]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "  Bram  ");
    await user.click(screen.getByRole("button", { name: "Voeg assessor toe" }));
    expect(onChange).toHaveBeenCalledWith(["Anya", "Bram"]);
  });

  it("adds a name via Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "Anya{Enter}");
    expect(onChange).toHaveBeenCalledWith(["Anya"]);
  });

  it("ignores empty/whitespace input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "   {Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a case-insensitive duplicate", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya"]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "anya{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes an assessor via its ✕ button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya", "Bram"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Verwijder Anya" }));
    expect(onChange).toHaveBeenCalledWith(["Bram"]);
  });
});
