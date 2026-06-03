import { Groep, Team, Student, TeamAssessment, CRITERIA } from "./types";

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Default initial mock data matching the PRD and scenario specifications
export const INITIAL_GROEPEN: Groep[] = [
  {
    id: "g-f01",
    name: "BKN-F01",
    assessoren: ["Sonia", "Mark"],
    datum: "2026-04-07",
    startTime: "09:00",
    endTime: "13:30",
    slotDuration: 30,
    pauzes: ["12:00"]
  },
  {
    id: "g-f02",
    name: "BKN-F02",
    assessoren: ["Jan", "Mark"],
    datum: "2026-04-10",
    startTime: "09:00",
    endTime: "14:00",
    slotDuration: 30,
    pauzes: ["12:00", "12:30"]
  }
];

export const INITIAL_TEAMS: Team[] = [
  { id: "t-1", groepId: "g-f01", teamNummer: "1", slotTime: "09:00" },
  { id: "t-2", groepId: "g-f01", teamNummer: "2", slotTime: "09:30" },
  { id: "t-3", groepId: "g-f01", teamNummer: "3", slotTime: "10:00" },
  { id: "t-4", groepId: "g-f01", teamNummer: "4", slotTime: "10:30" },
  { id: "t-5", groepId: "g-f01", teamNummer: "5", slotTime: "11:00" },
  
  { id: "t-6", groepId: "g-f02", teamNummer: "1", slotTime: "09:00" },
  { id: "t-7", groepId: "g-f02", teamNummer: "2", slotTime: "09:30" },
  { id: "t-8", groepId: "g-f02", teamNummer: "3", slotTime: "10:00" },
  { id: "t-9", groepId: "g-f02", teamNummer: "4", slotTime: "10:30" } // solo-team (1 student)
];

export const INITIAL_STUDENTEN: Student[] = [
  { id: "s-1", groepId: "g-f01", teamId: "t-1", name: "Baran" },
  { id: "s-2", groepId: "g-f01", teamId: "t-1", name: "Ivan" },
  { id: "s-3", groepId: "g-f01", teamId: "t-2", name: "Sanne" },
  { id: "s-4", groepId: "g-f01", teamId: "t-2", name: "Luuk" },
  { id: "s-5", groepId: "g-f01", teamId: "t-3", name: "Sarah" },
  { id: "s-6", groepId: "g-f01", teamId: "t-3", name: "Jasper" },
  { id: "s-7", groepId: "g-f01", teamId: "t-4", name: "Tim" },
  { id: "s-8", groepId: "g-f01", teamId: "t-4", name: "Eva" },
  { id: "s-9", groepId: "g-f01", teamId: "t-5", name: "Bram" },
  { id: "s-10", groepId: "g-f01", teamId: "t-5", name: "Meike" },

  { id: "s-11", groepId: "g-f02", teamId: "t-6", name: "Kevin" },
  { id: "s-12", groepId: "g-f02", teamId: "t-6", name: "Sophie" },
  { id: "s-13", groepId: "g-f02", teamId: "t-7", name: "Lieke" },
  { id: "s-14", groepId: "g-f02", teamId: "t-7", name: "Daan" },
  { id: "s-15", groepId: "g-f02", teamId: "t-8", name: "Milan" },
  { id: "s-16", groepId: "g-f02", teamId: "t-8", name: "Emma" },

  { id: "s-17", groepId: "g-f02", teamId: "t-9", name: "Noah" } // solo-team: één student
];

export const INITIAL_ASSESSMENTS: Record<string, TeamAssessment> = {
  "t-1": {
    teamId: "t-1",
    groepId: "g-f01",
    status: "completed",
    studentAssessments: {
      "s-1": { // Baran
        scores: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4 },
        isDuo: { 4: true },
        notes: {
          1: "✓ Integreert veranderkundige modellen\n\nBaran brengt op overtuigende wijze de Kotter-stappen in ter onderbouwing van de veranderingsaanpak en weegt alternatieven kritisch af.",
          2: "✓ Stemt interactiestijl af\n\nToont uitstekende communicatieve sensitiviteit en luistert aandachtig naar de inbreng van de medespeler.",
          3: "✓ Toont schakelend vermogen\n\nSchakelt soepel tussen de belangen van verschillende stakeholders en stelt constructieve pilots voor.",
          4: "✓ Toont proactieve bijdrage\n\nNeemt op natuurlijke wijze de leiding in de discussie zonder de ander te overvleugelen.",
          5: "✓ Toont interculturele sensitiviteit\n\nBrengt cultuurtheorietas Hofstede in om de fricties met de Poolse medewerkers constructief te duiden.",
          6: "✓ Toont ethisch kompas\n\nOpereert standvastig conform de OOA-gedragscode wanneer er gesproken wordt over integriteit van procesgegevens."
        }
      },
      "s-2": { // Ivan
        scores: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 1 },
        isDuo: { 4: true },
        notes: {
          1: "✓ Noemt veranderingsmodellen slechts oppervlakkig\n\nSlaat kritische fasen over en biedt te weinig beargumenteerde onderbouwing voor de voorgestelde reorganisatie-keuzes.",
          2: "✓ Communiceert taakgericht\n\nPrima functionele bijdrage maar zou oog moeten houden voor de behoeften van de minder ervaren gesprekspartner.",
          3: "✓ Begrijpt de krachtenvelden\n\nOnderkent politieke gevoeligheden, hoewel de vertaling naar operationele interventies beknopt blijft.",
          4: "✓ Toont proactieve bijdrage\n\nPrima duo-samenwerking.",
          5: "✓ Respecteert diversiteit\n\nToont respectvolle houding, maar past theorieën over cultuurverschillen niet actief of expliciet toe.",
          6: "✓ Neemt integriteitskwesties onvoldoende serieus\n\nIvan suggereerde om enkele negatieve procescijfers weg te laten om stakeholder-weerstand te manipuleren, hetgeen botst met de professionele code."
        }
      }
    }
  },
  "t-2": {
    teamId: "t-2",
    groepId: "g-f01",
    status: "completed",
    studentAssessments: {
      "s-3": { // Sanne
        scores: { 1: 2, 2: 3, 3: 2, 4: 2, 5: 2, 6: 2 },
        isDuo: {},
        notes: {
          1: "✓ Beschrijft veranderingsfases correct\n\nSystematische analyse van de ADKAR elementen.",
          2: "✓ Stemt interactiestijl af\n\nSluit uitstekend en reflectief aan bij feedback van examinatoren.",
          3: "✓ Begrijpt de krachtenvelden\n\nKeurige stakeholder-mapping verricht.",
          4: "✓ Voldoet aan duo-afspraken\n\nHelpt de groepsdynamiek prima teweegbrengen.",
          5: "✓ Respecteert diversiteit\n\nPrima basiskennis.",
          6: "✓ Handelt integer\n\nCorrecte afhandeling van dilemma."
        }
      },
      "s-4": { // Luuk
        scores: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 1 },
        isDuo: {},
        notes: {
          1: "✓ Beschrijft veranderingsfases correct\n\nGoede verbinding met de theorie.",
          2: "✓ Communiceert taakgericht\n\nDeelt effectief zakelijke informatie.",
          3: "✓ Begrijpt de krachtenvelden\n\nZiet spanningen binnen de organisatie.",
          4: "✓ Voldoet aan duo-afspraken\n\nNette interactie.",
          5: "✓ Respecteert diversiteit\n\nBasishouding is in orde.",
          6: "✓ Neemt integriteitskwesties onvoldoende serieus\n\nOnderkent morele dilemma's te weinig en negeert OOA richtlijnen bij de case-uitwerking."
        }
      }
    }
  }
};


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
        assessoren: ["Sonia", "Mark"], // default
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
