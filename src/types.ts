export interface Groep {
  id: string;
  name: string; // e.g., BKN-F01, BKN-F02
  assessoren: string[]; // e.g., ["Sonia", "Mark"]
  datum: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotDuration: number; // in minutes, multiple of 15 (e.g. 30)
  pauzes: string[]; // array of HH:MM starting times
}

export interface Team {
  id: string;
  groepId: string;
  teamNummer: string;
  slotTime: string | null; // HH:MM or null (unassigned)
}

export interface Student {
  id: string;
  groepId: string;
  teamId: string;
  name: string;
}

export interface Criterium {
  id: number;
  title: string;
  description: string;
  tagsByLevel: {
    Onder: string[];
    Op: string[];
    Boven: string[];
    Excellent: string[];
  };
}

export const CRITERIA: Criterium[] = [
  {
    id: 1,
    title: "Veranderen en evalueren",
    description: "Demonstreert overtuigend de uitleg van een theoretisch concept uit de fasen veranderen en/of evalueren van de bedrijfskundige handelingscyclus.",
    tagsByLevel: {
      Onder: ["geen theorie", "concept onjuist", "niet uitgelegd", "weinig voorbereid"],
      Op: ["concept benoemd", "basisuitleg", "beperkt voorbeeld", "weinig diepgang"],
      Boven: ["helder uitgelegd", "theorie correct", "goed voorbeeld", "verband met praktijk"],
      Excellent: ["diepgaande analyse", "concepten verbonden", "kritische reflectie", "eigenstandige toepassing"],
    }
  },
  {
    id: 2,
    title: "Sociaal communicatieve vaardigheden",
    description: "Gespreksvaardigheden passend bij een beginnend bedrijfskundig professional (actief luisteren, structureren, doorvragen, professionele houding).",
    tagsByLevel: {
      Onder: ["luistert niet", "onduidelijk verhaal", "onderbreekt duo", "passieve houding"],
      Op: ["actief luisterend", "vriendelijk", "redelijk verwoord", "volgt de rode draad"],
      Boven: ["sterke interactie", "vraagt goed door", "vloeiende argumentatie", "professionele toon"],
      Excellent: ["leidt het gesprek", "empathisch sturend", "uitstekende pitch", "overtuigend debatterend"],
    }
  },
  {
    id: 3,
    title: "Schakelen en verbinden",
    description: "Demonstreert het vermogen om weerstand bij belanghebbenden om te zetten in veranderbereidheid en verbinding te leggen.",
    tagsByLevel: {
      Onder: ["negeert weerstand", "gaat in verdediging", "geen inleving", "blijft drammen"],
      Op: ["erkent weerstand", "luistert naar argument", "zoekt een compromis", "blijft kalm"],
      Boven: ["verbinding gemaakt", "weerstand omgebogen", "belangen benoemd", "gemeenschappelijk doel"],
      Excellent: ["synergie gecreëerd", "strategisch bewogen", "diep vertrouwen gewekt", "weerstand als kans"],
    }
  },
  {
    id: 4,
    title: "Professionaliseren (bijdrage)",
    description: "Professionele bijdrage aan het teamresultaat en aantoonbare groei als bedrijfskundig professional gedurende de simulatie.",
    tagsByLevel: {
      Onder: ["geen procesreflectie", "leert niet van feedback", "geen eigen visie", "nauwelijks bijgedragen"],
      Op: ["reflecteert oppervlakkig", "staat open voor feedback", "toont basale groei", "voldoende bijdrage"],
      Boven: ["sterke reflectie", "feedback toegepast", "toont concrete groei", "actieve trekker"],
      Excellent: ["diepgaande zelfanalyse", "proactieve leergreep", "visie op professie", "leiderschap in team"],
    }
  },
  {
    id: 5,
    title: "Professionaliseren (intercultureel)",
    description: "Bespreekt en analyseert een intercultureel issue uit de case en stelt een passende cultuursensitieve aanpak voor.",
    tagsByLevel: {
      Onder: ["negeert cultuurverschil", "bevooroordeeld", "geen cultureel besef", "ethnocentrisch"],
      Op: ["herkent cultuurfactor", "toont belangstelling", "respectvolle houding", "basiskennis cultuur"],
      Boven: ["concept geanalyseerd", "overbrugt cultuurkloof", "past cultuurmodel toe", "sensitief handelen"],
      Excellent: ["diep cultureel inzicht", "inclusief klimaat", "cultuur specifieke synergie", "rolmodel diversiteit"],
    }
  },
  {
    id: 6,
    title: "Handelen vanuit waarden",
    description: "Analyseert en lost een morele kwestie op die zich in de case voordoet, in lijn met de gedragsregels van de OOA.",
    tagsByLevel: {
      Onder: ["negeert integriteit", "geen ethisch besef", "eigenbelang eerst", "kent OOA regels niet"],
      Op: ["herkent moreel dillema", "noemt OOA gedragscode", "zoekt fatsoenlijke oplossing", "integer basisniveau"],
      Boven: ["analyseert moreel aspect", "beargumenteert afweging", "integer onder druk", "conform OOA code"],
      Excellent: ["moreel kompas getoond", "stelt integriteit centraal", "overstijgende ethische visie", "ambassadeur waarden"],
    }
  }
];

export interface StudentAssessment {
  scores: Record<number, number>; // criteriumId (1-6) => score (1-4)
  isDuo: Record<number, boolean>;  // criteriumId (1-6) => boolean
  notes: Record<number, string>;   // criteriumId (1-6) => text notes (combining free text and ✓ tags)
}

export interface TeamAssessment {
  teamId: string;
  groepId: string;
  studentAssessments: Record<string, StudentAssessment>; // studentId => StudentAssessment
  status: "not_started" | "partial" | "completed";
  aiTranscript?: {
    timestamp: string;
    speaker: string;
    text: string;
    competencyDetected?: {
      criteriumId: number;
      studentId: string;
      level: "Onder" | "Op" | "Boven" | "Excellent";
      quote: string;
    };
  }[];
  aiFeedbackSuggestions?: {
    studentId: string;
    strengths: string[];
    improvements: string[];
    scoreSuggestions: {
      criteriumId: number;
      level: "Onder" | "Op" | "Boven" | "Excellent";
      reasoning: string;
    }[];
  }[];
}

export type LevelType = "Onder" | "Op" | "Boven" | "Excellent";

export const LEVEL_SCORES: Record<LevelType, number> = {
  Onder: 1,
  Op: 2,
  Boven: 3,
  Excellent: 4,
};

export const LEVEL_COLORS: Record<LevelType, string> = {
  Onder: "bg-red-55 px-3 py-1 text-red-700 hover:bg-red-100 border border-red-200",
  Op: "bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-100 border border-amber-200",
  Boven: "bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100 border border-emerald-200",
  Excellent: "bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-100 border border-indigo-200",
};

export const LEVEL_BADGES: Record<LevelType, string> = {
  Onder: "bg-red-100 text-red-800 border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full",
  Op: "bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full",
  Boven: "bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full",
  Excellent: "bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2 py-0.5 rounded-full",
};

export function getCijferFromScore(totalScore: number): number {
  if (totalScore >= 24) return 10;
  if (totalScore >= 20) return 9;
  if (totalScore >= 16) return 8;
  if (totalScore >= 14) return 7;
  if (totalScore >= 12) return 6;
  if (totalScore >= 10) return 5;
  return 4;
}
