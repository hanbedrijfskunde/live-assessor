import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AiNotulistPanel from "../../src/components/AiNotulistPanel";

beforeEach(() => {
  vi.stubGlobal("alert", () => {}); // handleApply shows a success alert
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AiNotulistPanel — simulation buttons", () => {
  it("renders the three score-profile buttons labelled with the team name", () => {
    render(<AiNotulistPanel students={[{ id: "sA", name: "Bart" }]} onApplySuggestions={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Alles onvoldoende/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alles uitstekend/ })).toBeInTheDocument();
    expect(screen.getAllByText("Bart").length).toBeGreaterThan(0);
  });
});

describe("AiNotulistPanel — apply wiring", () => {
  it("plays an 'onvoldoende' simulation and applies all-Onder scores", () => {
    vi.useFakeTimers();
    const onApply = vi.fn();
    render(<AiNotulistPanel students={[{ id: "sA", name: "Bart" }]} onApplySuggestions={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: /Alles onvoldoende/ }));
    // Solo playback = 1 welcome + 6*(1 question + 1 turn) = 13 lines @ 700ms;
    // one extra tick surfaces the final analysis + apply button.
    act(() => { vi.advanceTimersByTime(15 * 700); });

    fireEvent.click(screen.getByRole("button", { name: /Gebruik AI Suggesties/ }));

    expect(onApply).toHaveBeenCalledTimes(1);
    const [scores] = onApply.mock.calls.at(-1)!;
    expect(scores.Bart[1]).toBe(1);
    expect(scores.Bart[6]).toBe(1);
  });
});
