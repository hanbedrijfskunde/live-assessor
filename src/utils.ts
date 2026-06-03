import { Groep, Team, Student } from "./types";

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Load from LocalStorage
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error loading key "${key}" from localStorage:`, e);
    return defaultValue;
  }
}

// Save to LocalStorage
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key "${key}" to localStorage:`, e);
  }
}

// Helper to parse CSV string with comma or semicolon auto-detection
export function parseCSV(text: string): { groups: Groep[], teams: Team[], students: Student[] } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return { groups: [], teams: [], students: [] };

  // Detect delimiter (comma vs semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  // Parse headers
  const headers = firstLine.split(delimiter).map(h => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
  
  const studentIndex = headers.indexOf("student") !== -1 ? headers.indexOf("student") : headers.indexOf("naam");
  const groepIndex = headers.indexOf("groep") !== -1 ? headers.indexOf("groep") : headers.indexOf("klas");
  const teamIndex = headers.indexOf("team") !== -1 ? headers.indexOf("team") : headers.indexOf("teamnummer");

  if (studentIndex === -1 || groepIndex === -1 || teamIndex === -1) {
    throw new Error("CSV moet kolommen bevatten voor: Student/Naam, Groep/Klas, en Team/Teamnummer.");
  }

  const groupMap = new Map<string, Groep>();
  const teamMap = new Map<string, Team>();
  const studentList: Student[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.replace(/^["']|["']$/g, "").trim());
    if (values.length < Math.max(studentIndex, groepIndex, teamIndex) + 1) continue;

    const studentName = values[studentIndex];
    const groepName = values[groepIndex];
    const teamNummer = values[teamIndex];

    if (!studentName || !groepName || !teamNummer) continue;

    const groepId = `g-${groepName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const teamId = `t-${groepId}-${teamNummer}`;

    // Add Groep if not exists
    if (!groupMap.has(groepName)) {
      groupMap.set(groepName, {
        id: groepId,
        name: groepName,
        assessoren: [], // default
        datum: new Date().toISOString().split("T")[0], // today
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        pauzes: ["12:00"]
      });
    }

    // Add Team if not exists
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        id: teamId,
        groepId: groepId,
        teamNummer: teamNummer,
        slotTime: null // will be distributed
      });
    }

    // Add Student
    studentList.push({
      id: `s-${generateId()}`,
      groepId: groepId,
      teamId: teamId,
      name: studentName
    });
  }

  const groups = Array.from(groupMap.values());
  const teams = Array.from(teamMap.values());

  // Distribute teams over slots automatically (skipping standard 12:00 pause slot)
  for (const group of groups) {
    const groupTeams = teams.filter(t => t.groepId === group.id);
    let currentMin = timeToMinutes(group.startTime);
    const endMin = timeToMinutes(group.endTime);

    for (let j = 0; j < groupTeams.length; j++) {
      let slotTimeStr = minutesToTime(currentMin);
      
      // Skip pauses
      while (group.pauzes.includes(slotTimeStr) && currentMin < endMin) {
        currentMin += group.slotDuration;
        slotTimeStr = minutesToTime(currentMin);
      }

      if (currentMin >= endMin) break;
      groupTeams[j].slotTime = slotTimeStr;
      currentMin += group.slotDuration;
    }
  }

  return { groups, teams, students: studentList };
}

// Convert "HH:MM" to minutes from start of day
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Generate the list of slots for a group (e.g., ["09:00", "09:30", ...])
export function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slots: string[] = [];

  for (let t = start; t < end; t += slotDuration) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

// Format date to Dutch representation (e.g. "di 7 apr")
export function formatDutchDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    return date.toLocaleDateString("nl-NL", options);
  } catch (e) {
    return dateStr;
  }
}

// Backup as JSON download
export function downloadBackup(data: any, fileName: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export array of arrays to Excel-complient CSV with Semicolon
export function downloadCSV(headers: string[], rows: string[][], fileName: string): void {
  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(cell => {
      const cleanCell = (cell || "").toString().replace(/"/g, '""');
      return cleanCell.includes(";") || cleanCell.includes("\n") || cleanCell.includes(",") ? `"${cleanCell}"` : cleanCell;
    }).join(";"))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
