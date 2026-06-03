import { describe, it, expect } from "vitest";
import { timeToMinutes, minutesToTime, generateTimeSlots } from "../../src/utils";

describe("time helpers", () => {
  it("converts HH:MM to minutes from midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("13:30")).toBe(810);
  });

  it("converts minutes back to zero-padded HH:MM", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(540)).toBe("09:00");
    expect(minutesToTime(810)).toBe("13:30");
  });

  it("round-trips time <-> minutes", () => {
    for (const t of ["07:15", "09:45", "12:00", "23:59"]) {
      expect(minutesToTime(timeToMinutes(t))).toBe(t);
    }
  });
});

describe("generateTimeSlots", () => {
  it("generates slots with the end time exclusive", () => {
    expect(generateTimeSlots("09:00", "11:00", 30)).toEqual([
      "09:00", "09:30", "10:00", "10:30",
    ]);
  });

  it("honours the slot duration", () => {
    expect(generateTimeSlots("09:00", "10:00", 15)).toEqual([
      "09:00", "09:15", "09:30", "09:45",
    ]);
  });

  it("returns an empty list when start >= end", () => {
    expect(generateTimeSlots("11:00", "11:00", 30)).toEqual([]);
    expect(generateTimeSlots("12:00", "11:00", 30)).toEqual([]);
  });
});
