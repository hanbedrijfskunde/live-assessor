import { describe, it, expect } from "vitest";
import { GESPREKSSCRIPT } from "../../src/gespreksscript";
import { CRITERIA } from "../../src/types";

describe("GESPREKSSCRIPT — data integrity", () => {
  it("covers exactly the six CRITERIA ids, in order", () => {
    const scriptIds = GESPREKSSCRIPT.criteria.map((b) => b.criteriumId);
    const critIds = CRITERIA.map((c) => c.id);
    expect(scriptIds).toEqual(critIds);
  });

  it("gives every criterium a toelichting, a startvraag and at least two doorvragen", () => {
    for (const block of GESPREKSSCRIPT.criteria) {
      expect(block.toelichting.trim().length).toBeGreaterThan(0);
      expect(block.startvraag.trim().length).toBeGreaterThan(0);
      expect(block.doorvragen.length).toBeGreaterThanOrEqual(2);
      expect(block.doorvragen.every((q) => q.trim().length > 0)).toBe(true);
    }
  });

  it("has a non-empty opening, afsluiting and timing", () => {
    expect(GESPREKSSCRIPT.opening.length).toBeGreaterThan(0);
    expect(GESPREKSSCRIPT.afsluiting.length).toBeGreaterThan(0);
    expect(GESPREKSSCRIPT.opening.every((l) => l.trim().length > 0)).toBe(true);
    expect(GESPREKSSCRIPT.afsluiting.every((l) => l.trim().length > 0)).toBe(true);
    expect(GESPREKSSCRIPT.timing.trim().length).toBeGreaterThan(0);
  });
});
