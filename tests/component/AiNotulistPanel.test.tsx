import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AiNotulistPanel from "../../src/components/AiNotulistPanel";

const apiResult = {
  success: true,
  transcript: [{ timestamp: "00:01", speaker: "Bart", text: "hallo wereld" }],
  analysis: {
    scores: { Bart: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
    tags: { Bart: {} }, reasoning: { Bart: {} }, quotes: { Bart: {} },
    feedback: { Bart: { strengths: [], improvements: [] } },
  },
};

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

describe("AiNotulistPanel — audio upload", () => {
  it("posts an uploaded audio file to the API and renders the transcript", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => apiResult }));
    vi.stubGlobal("fetch", fetchMock as any);

    const { container } = render(
      <AiNotulistPanel students={[{ id: "sA", name: "Bart" }]} onApplySuggestions={vi.fn()} />
    );
    // The file input is visually hidden (display:none), which userEvent.upload
    // refuses to touch — set files directly and dispatch change.
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["audio-bytes"], "clip.webm", { type: "audio/webm" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    // The returned line shows in the transcript column AND as a competency-feed
    // quote, so it appears more than once — assert at least one.
    const matches = await screen.findAllByText(/hallo wereld/, undefined, { timeout: 3000 });
    expect(matches.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/analyze-assessment",
      expect.objectContaining({ method: "POST" })
    );
  });
});
