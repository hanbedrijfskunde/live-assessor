import { describe, it, expect } from "vitest";
import { formatDutchDate } from "../../src/utils";

describe("formatDutchDate", () => {
  it("formats an ISO date into a short Dutch representation", () => {
    const out = formatDutchDate("2026-04-07");
    expect(typeof out).toBe("string");
    // Locale output differs from the raw ISO input and contains the day number.
    expect(out).not.toBe("2026-04-07");
    expect(out).toMatch(/7/);
    expect(out.toLowerCase()).toContain("apr");
  });

  it("never throws on malformed input", () => {
    expect(() => formatDutchDate("not-a-date")).not.toThrow();
  });
});
