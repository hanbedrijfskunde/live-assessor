import { describe, it, expect } from "vitest";
import { parseCSV } from "../../src/utils";

describe("parseCSV", () => {
  it("parses semicolon-delimited data into groups, teams and students", () => {
    const csv = [
      "Student;Groep;Team",
      "Baran;BKN-F01;1",
      "Ivan;BKN-F01;1",
      "Sanne;BKN-F01;2",
    ].join("\n");

    const { groups, teams, students } = parseCSV(csv);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("BKN-F01");
    expect(groups[0].id).toBe("g-bknf01");
    expect(teams).toHaveLength(2);
    expect(students.map(s => s.name)).toEqual(["Baran", "Ivan", "Sanne"]);
    // Team 1 holds two students, team 2 holds one.
    const team1 = teams.find(t => t.teamNummer === "1")!;
    expect(students.filter(s => s.teamId === team1.id)).toHaveLength(2);
  });

  it("auto-detects a comma delimiter", () => {
    const csv = "Student,Groep,Team\nNoah,BKN-F02,4";
    const { groups, teams, students } = parseCSV(csv);
    expect(groups).toHaveLength(1);
    expect(teams).toHaveLength(1);
    expect(students[0].name).toBe("Noah");
  });

  it("accepts Dutch header aliases (naam / klas / teamnummer)", () => {
    const csv = "Naam;Klas;Teamnummer\nEva;BKN-F03;7";
    const { students, groups } = parseCSV(csv);
    expect(students[0].name).toBe("Eva");
    expect(groups[0].name).toBe("BKN-F03");
  });

  it("distributes team slots and skips the 12:00 pause", () => {
    // Default group runs 09:00-17:00, 30-min slots, pause at 12:00.
    const rows = ["Student;Groep;Team"];
    for (let i = 1; i <= 3; i++) rows.push(`S${i};BKN-X;${i}`);
    const { teams } = parseCSV(rows.join("\n"));
    const slots = teams.map(t => t.slotTime);
    expect(slots).toEqual(["09:00", "09:30", "10:00"]);
    expect(slots).not.toContain("12:00");
  });

  it("throws when a required column is missing", () => {
    expect(() => parseCSV("Student;Team\nBaran;1")).toThrow();
  });

  it("returns empty arrays for empty input", () => {
    expect(parseCSV("")).toEqual({ groups: [], teams: [], students: [] });
  });
});
