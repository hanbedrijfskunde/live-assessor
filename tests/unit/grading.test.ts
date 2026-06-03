import { describe, it, expect } from "vitest";
import { getCijferFromScore, LEVEL_SCORES, CRITERIA } from "../../src/types";

// F0 harness check + first slice of F1 domain logic. Proves Vitest can compile
// and import the TypeScript domain module.
describe("getCijferFromScore", () => {
  it("maps point totals to the correct cijfer at each threshold", () => {
    expect(getCijferFromScore(24)).toBe(10);
    expect(getCijferFromScore(23)).toBe(9);
    expect(getCijferFromScore(20)).toBe(9);
    expect(getCijferFromScore(16)).toBe(8);
    expect(getCijferFromScore(14)).toBe(7);
    expect(getCijferFromScore(12)).toBe(6);
    expect(getCijferFromScore(10)).toBe(5);
    expect(getCijferFromScore(9)).toBe(4);
    expect(getCijferFromScore(6)).toBe(4);
  });
});

describe("domain constants", () => {
  it("defines exactly six criteria", () => {
    expect(CRITERIA).toHaveLength(6);
  });

  it("maps levels to scores 1..4", () => {
    expect(LEVEL_SCORES).toEqual({ Onder: 1, Op: 2, Boven: 3, Excellent: 4 });
  });
});
