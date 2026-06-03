import { describe, it, expect } from "vitest";
import { buildSimulation } from "../../src/components/AiNotulistPanel";

const solo = [{ id: "sA", name: "Bart" }];
const trio = [{ id: "a", name: "Bart" }, { id: "b", name: "Lisa" }, { id: "c", name: "Tom" }];
const crits = [1, 2, 3, 4, 5, 6];

describe("buildSimulation — score patterns", () => {
  it("'onvoldoende' scores every criterion 1 (Onder)", () => {
    const { analysis } = buildSimulation(solo, "onvoldoende");
    crits.forEach(c => expect(analysis.scores.Bart[c]).toBe(1));
  });

  it("'uitstekend' scores every criterion 4 (Excellent)", () => {
    const { analysis } = buildSimulation(solo, "uitstekend");
    crits.forEach(c => expect(analysis.scores.Bart[c]).toBe(4));
  });

  it("'random' stays in the passing band {2,3,4}", () => {
    const { analysis } = buildSimulation(solo, "random");
    Object.values(analysis.scores.Bart).forEach(v => expect([2, 3, 4]).toContain(v));
  });
});

describe("buildSimulation — shape & roster", () => {
  it("keys analysis by the actual student names (solo and trio)", () => {
    expect(Object.keys(buildSimulation(solo, "uitstekend").analysis.scores)).toEqual(["Bart"]);
    expect(Object.keys(buildSimulation(trio, "uitstekend").analysis.scores)).toEqual(["Bart", "Lisa", "Tom"]);
  });

  it("produces one transcript line per examinator question + student turn, plus a welcome", () => {
    const { transcript, detections } = buildSimulation(trio, "uitstekend");
    // 1 welcome + 6 criteria * (1 question + 3 student turns) = 25 lines.
    expect(transcript).toHaveLength(1 + 6 * (1 + 3));
    // One competency detection per student per criterion (3 * 6 = 18), rest null.
    expect(detections.filter(Boolean)).toHaveLength(18);
  });

  it("opens with an examinator welcome naming every student", () => {
    const { transcript } = buildSimulation(trio, "onvoldoende");
    expect(transcript[0].speaker).toBe("Examinator");
    expect(transcript[0].text).toContain("Bart");
    expect(transcript[0].text).toContain("Lisa");
    expect(transcript[0].text).toContain("Tom");
  });

  it("fills tags, reasoning and feedback for each student", () => {
    const { analysis } = buildSimulation(trio, "uitstekend");
    for (const name of ["Bart", "Lisa", "Tom"]) {
      crits.forEach(c => {
        expect(analysis.tags[name][c].length).toBeGreaterThan(0);
        expect(analysis.reasoning[name][c]).toBeTruthy();
      });
      expect(Array.isArray(analysis.feedback[name].strengths)).toBe(true);
      expect(Array.isArray(analysis.feedback[name].improvements)).toBe(true);
    }
  });
});
