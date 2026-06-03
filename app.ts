import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();

// Increase payload limit for base64 audio
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Shared Gemini client. Lazily created from the environment, but overridable in
// tests via setGeminiClientForTesting() so the API routes can be exercised
// without real network calls (or forced down the fallback path with null).
let aiClient: GoogleGenAI | null = null;
let aiClientOverridden = false;

export function setGeminiClientForTesting(client: GoogleGenAI | null): void {
  aiClient = client;
  aiClientOverridden = true;
}

export function resetGeminiClientForTesting(): void {
  aiClient = null;
  aiClientOverridden = false;
}

function getGeminiClient(): GoogleGenAI | null {
  if (aiClientOverridden) return aiClient;
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// 3 Realistic Simulation Scenarios
const SIMULATION_SCENARIOS: Record<string, any> = {
  scenario_a: {
    title: "Scenario A: Student 1 & Student 2 (Focus op Veranderen & Evalueren en Weerstand)",
    transcript: [
      { timestamp: "00:15", speaker: "Examinator", text: "Welkom Student 1 en Student 2 bij jullie PROMEF Midterm Assessment. Laten we meteen beginnen met het eerste criterium: Veranderen en evalueren. Student 1, kun jij de veranderbereidheid in jullie case toelichten met een bedrijfskundig model?" },
      { timestamp: "00:45", speaker: "Student 1", text: "Ja, klopt. We hebben geanalyseerd via Kotter's 8-stappen model. We zagen dat de 'Urgency' (stap 1) erg laag was in het team. Om dit te veranderen, hebben we eerst een coalitie gevormd met de informele leiders van de afdeling. Zo hebben we stap 2 toegepast." },
      { timestamp: "01:25", speaker: "Examinator", text: "Heel scherp. En Student 2, hoe hebben jullie stap 3 en 4 van Kotter hierop aangesloten om de visie te communiceren?" },
      { timestamp: "01:40", speaker: "Student 2", text: "Nou, we hebben eigenlijk geen echte visie uitgeschreven. We hebben ze gewoon verteld dat het systeem anders moet en dat ze mee moeten doen anders lopen ze achter. Maar we hebben wel geprobeerd erover te praten bij de koffieautomaat." },
      { timestamp: "02:10", speaker: "Student 1", text: "Als ik mag aanvullen, we hebben wel een communicatieplan opgesteld, maar die is door weerstand van de teamleider niet volledig uitgevoerd. De teamleider zei: 'Dit gaat ons te veel tijd kosten.' Ik heb toen voorgesteld om een pilot te draaien om te laten zien dat het juist 4 uur per week bespaart. Daarmee ging de teamleider overstag en kregen we wel draagvlak." },
      { timestamp: "03:00", speaker: "Examinator", text: "Interessant, Student 1. Dat raakt ook direct aan Schakelen en verbinden. Student 2, hoe ging jij om met de weerstand van de werkvloer?" },
      { timestamp: "03:15", speaker: "Student 2", text: "Ik vond het vooral vervelend dat ze zo klaagden. Ik heb gezegd dat ze niet zo moeilijk moeten doen en dat het besluit al genomen is door het management. Dat hielp niet echt, ze werden alleen maar stiller." },
      { timestamp: "03:45", speaker: "Examinator", text: "Duidelijk. Laten we kijken naar een intercultureel aspect uit de case. Hoe hebben jullie rekening gehouden met de cultuurverschillen in het internationale team?" },
      { timestamp: "04:00", speaker: "Student 2", text: "Er waren een paar Poolse medewerkers. We hebben daar niet echt speciaal rekening mee gehouden, iedereen spreekt toch gewoon Engels in het bedrijf? Dus dat leek me niet echt een probleem." },
      { timestamp: "04:30", speaker: "Student 1", text: "Nou, we merkten wel dat de Poolse collega's minder snel hun mening gaven in de grotere vergaderingen. Ik heb me verdiept in Hofstede's cultuurdimensies, en met name de machtsafstand bleek daar een rol te spelen. Daarom hebben we kleinere sub-sessies georganiseerd waar ze zich veiliger voelden om feedback te geven. Dit werkte erg goed." },
      { timestamp: "05:15", speaker: "Examinator", text: "Uitstekend gedaan, Student 1. Tot slot, een moreel dilemma: de manager vroeg jullie om de evaluatieresultaten wat rooskleuriger voor te stellen aan het Directieteam. Hoe hebben jullie gehandeld in relatie tot de OOA gedragscode?" },
      { timestamp: "05:35", speaker: "Student 2", text: "Ja, we hebben de cijfers een beetje afgerond naar boven. De manager is tenslotte onze opdrachtgever, dus je moet hem wel te vriend houden, anders krijgen we misschien een slechte beoordeling voor ons advies." },
      { timestamp: "06:00", speaker: "Student 1", text: "Wacht, Student 2, dat hebben we uiteindelijk niet gedaan! Ik heb de OOA-gedragscode erbij gepakt, specifiek de regel over professionaliteit en onafhankelijkheid. Ik heb de manager uitgelegd dat een misleidend rapport de organisatie uiteindelijk schaadt en onze professionele integriteit aantast. We hebben toen de echte data gepresenteerd, maar wel voorzien van een constructief actieplan om de tegenvallende resultaten direct aan te pakken. De manager respecteerde dat gelukkig." }
    ],
    analysis: {
      scores: {
        "Student 1": { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4 },
        "Student 2": { 1: 1, 2: 2, 3: 1, 4: 2, 5: 1, 6: 1 }
      },
      tags: {
        "Student 1": {
          1: ["theorie correct", "helder uitgelegd"],
          2: ["sterke interactie", "vraagt goed door"],
          3: ["weerstand omgebogen", "verbinding gemaakt"],
          4: ["toont concrete groei", "sterke reflectie"],
          5: ["past cultuurmodel toe", "sensitief handelen"],
          6: ["moreel kompas getoond", "conform OOA code", "stelt integriteit centraal"]
        },
        "Student 2": {
          1: ["concept onjuist", "niet uitgelegd"],
          2: ["redelijk verwoord", "luistert naar partner"],
          3: ["negeert weerstand", "blijft drammen"],
          4: ["reflecteert oppervlakkig"],
          5: ["negeert cultuurverschil", "geen cultureel besef"],
          6: ["negeert integriteit", "eigenbelang eerst"]
        }
      },
      reasoning: {
        "Student 1": {
          1: "Student 1 legt Kotters model correct en gestructureerd uit en koppelt dit direct aan stappen uit de case.",
          3: "Toont uitstekend schakelen en verbinden door de weerstand van de teamleider om te buigen met een concreet voorstel voor een pilot-sessie.",
          5: "Herkent cultuurverschillen, past Hofstede theoretisch toe en past de aanpak succesvol aan.",
          6: "Demonstreert een sterk moreel kompas door de OOA-code te hanteren en stand te houden tegenover onethische verzoeken van de manager."
        },
        "Student 2": {
          1: "Student 2 toont geen theoretische kennis en bagatelliseert het gebrek aan een gedeelde visie.",
          3: "Zorgt voor escalatie van weerstand door medewerkers te vertellen dat ze niet moeten zeuren.",
          5: "Toont geen intercultureel bewustzijn en bagatelliseert de Poolse cultuurverschillen.",
          6: "Is bereid om data te manipuleren uit opportunisme, wat in directe strijd is met de OOA-gedragscode."
        }
      },
      feedback: {
        "Student 1": {
          strengths: [
            "Sterke integratie van theorie (Kotter, Hofstede, OOA) in de praktijkervaring.",
            "Uitzonderlijk professioneel optreden bij integriteitskwesties (moreel kompas).",
            "Resultaat- en mensgericht handelen bij het omgaan met weerstand."
          ],
          improvements: [
            "Blijf je duo-partner stimuleren om actiever deel te nemen aan de theoretische reflectie tijdens het gesprek."
          ]
        },
        "Student 2": {
          strengths: [
            "Praat makkelijk en is vriendelijk in de omgang.",
            "Stelt zich open op en deelt eerlijk hoe hij heeft gehandeld."
          ],
          improvements: [
            "Bestudeer de theorieën (Kotter, Hofstede, OOA-code) grondig voor het eindexamen.",
            "Ontwikkel inlevingsvermogen bij weerstand op de werkvloer; ga niet defensief of autoritair reageren.",
            "Bewaak je professionele ethiek; stem nooit in met de manipulatie van adviesgegevens."
          ]
        }
      }
    }
  },
  scenario_b: {
    title: "Scenario B: Student 1 & Student 2 (Focus op Communicatie en Samenwerking)",
    transcript: [
      { timestamp: "00:20", speaker: "Examinator", text: "Laten we beginnen, Student 1 en Student 2. Student 1, hoe hebben jullie de projectplanning en stakeholdermanagement aangepakt?" },
      { timestamp: "00:50", speaker: "Student 1", text: "We zijn gestart met een stakeholdersanalyse. We hebben de macht-interesse matrix getekend om de belangrijkste spelers te mappen. Student 2 was verantwoordelijk voor de interviews met de Directie en ik deed de afdelingshoofden." },
      { timestamp: "01:15", speaker: "Student 2", text: "Ja, klopt. De corporate cultuur is daar vrij formeel. Ik vond de interviews met de directieleden best intimiderend. Ik merkte dat ik heel erg vasthield aan mijn vragenlijst, waardoor ik niet echt doorvroeg op moeilijke onderwerpen. Maar Student 1 gaf me daarna feedback om opener vragen te stellen, en bij de volgende interviews ging dat al direct een stuk beter!" },
      { timestamp: "01:50", speaker: "Examinator", text: "Heel mooie reflectie, Student 2. Dat laat groei zien op Professionaliseren en Sociaal-communicatieve vaardigheden. Student 1, hoe reageerde jij op de feedback die je van Student 2 of de organisatie kreeg?" },
      { timestamp: "02:10", speaker: "Student 1", text: "Ik kreeg van een van de afdelingshoofden te horen dat mijn adviestoon in het begin te dwingend overkwam. Ze zeiden: 'Je bent pas student, kom ons niet vertellen hoe we ons werk moeten doen.' Ik schrok daarvan, maar ik heb direct een vervolggesprek aangevraagd waarin ik m'n excuses heb aangeboden en heb gevraagd hoe we het samen konden inkleden. Dat toonde m'n bereidheid om te leren." },
      { timestamp: "02:45", speaker: "Examinator", text: "Mooi. Hoe hebben jullie het morele dilemma aangepakt rondom de geheimhouding van het inkrimping-advies?" },
      { timestamp: "03:00", speaker: "Student 1", text: "Dat was heel lastig. Een bevriende teamleider vroeg mij of er banen gingen verdwijnen. Ik wist dat dit zo was, maar we hadden getekend voor geheimhouding. Ik heb hem gezegd dat ik de details van het lopende onderzoek niet kon delen, maar hem wel verwezen naar de formele communicatiekanalen van de directie. Zo bleef ik integer." },
      { timestamp: "03:30", speaker: "Student 2", text: "Ik vond dat ook heel moeilijk. Ik heb m'n mond wel per ongeluk een beetje voorbij gepraat tegen een collega. Achteraf voelde ik me heel schuldig. Ik ben toen meteen naar de senior consultant gegaan om te melden wat ik had gezegd, zodat ze eventuele schade konden beperken. Dat was pijnlijk, maar wel de meest integere weg." }
    ],
    analysis: {
      scores: {
        "Student 1": { 1: 2, 2: 3, 3: 3, 4: 3, 5: 2, 6: 3 },
        "Student 2": { 1: 2, 2: 2, 3: 2, 4: 3, 5: 2, 6: 3 }
      },
      tags: {
        "Student 1": {
          1: ["concept benoemd", "basisuitleg"],
          2: ["sterke interactie", "professionele toon"],
          3: ["verbinding gemaakt", "weerstand omgebogen"],
          4: ["feedback toegepast", "sterke reflectie", "toont concrete groei"],
          5: ["herkent cultuurfactor", "respectvolle houding"],
          6: ["analyseert moreel aspect", "integer onder druk"]
        },
        "Student 2": {
          1: ["concept benoemd", "basisuitleg"],
          2: ["actief luisterend", "vriendelijk"],
          3: ["erkent weerstand", "zoekt een compromis"],
          4: ["feedback toegepast", "toont concrete groei", "sterke reflectie"],
          5: ["herkent cultuurfactor", "respectvolle houding"],
          6: ["analyseert moreel aspect", "integer onder druk"]
        }
      },
      reasoning: {
        "Student 1": {
          2: "Student 1 formuleert helder, toont een uitstekende professionele toon en herstelt een stroef stakeholderscontact zeer volwassen.",
          4: "Reflecteert diep op kritische feedback uit de organisatie en past haar gedrag proactief aan.",
          6: "Houdt zich strikt aan de geheimhouding ondanks persoonlijke druk."
        },
        "Student 2": {
          4: "Toont enorme groei door fouten in interviewtechniek direct te corrigeren na feedback.",
          6: "Neemt volledige verantwoordelijkheid voor een gemaakte fout en meldt dit direct bij de leidinggevende om schade te voorkomen. Zeer integer."
        }
      },
      feedback: {
        "Student 1": {
          strengths: [
            "Hoge professionele weerbaarheid en sterke communicatieve vaardigheden.",
            "Uitstekende ombuiging van persoonlijke adviesweerstand bij een stakeholder."
          ],
          improvements: [
            "Probeer theoretische concepten nog iets explicieter te onderbouwen (bijv. specifiekere modellen voor stakeholder engagement)."
          ]
        },
        "Student 2": {
          strengths: [
            "Grote kwetsbaarheid en oprechte leerhouding.",
            "Kiest voor integriteit en transparantie, zelfs als dat persoonlijk nadelig is."
          ],
          improvements: [
            "Oefen met actieve gesprekstechnieken (doorvragen) om minder afhankelijk te zijn van vaste vragenlijsten."
          ]
        }
      }
    }
  },
  scenario_c: {
    title: "Scenario C: Student 1 & Student 2 (Excellente prestaties op alle vlakken)",
    transcript: [
      { timestamp: "00:10", speaker: "Examinator", text: "Hallo Student 1 en Student 2. Laten we van start gaan met jullie presentatie en de onderbouwing van jullie verander- en evaluatiestrategie." },
      { timestamp: "00:30", speaker: "Student 2", text: "Dank u. We hebben voor de verandering van het ERP-systeem de ADKAR-methodiek gehanteert. We zagen dat de 'Awareness' en 'Desire' erg laag waren door slechte eerdere ervaringen. Om dit te evalueren hebben we een nulmeting gedaan via een kwantitatieve enquête, gecombineerd met kwalitatieve focusgroepen om de diepere pijnpunten te begrijpen." },
      { timestamp: "01:20", speaker: "Student 1", text: "Aanvullend hebben we de theorie van Lewin over 'Unfreezing, Changing, Refreezing' gebruikt om de transitiefases te structureren. We hebben aangetoond dat de weerstand niet onwil was, maar angst voor verlies van competentie. Door gerichte trainingen aan te bieden, hebben we de 'Desire' en 'Ability' binnen ADKAR tegelijk gestimuleerd." },
      { timestamp: "02:00", speaker: "Examinator", text: "Dit getuigt van een zeer diepe en correcte integratie van meerdere theorieën! En hoe hebben jullie de weerstand van het operationeel management opgelost?" },
      { timestamp: "02:20", speaker: "Student 2", text: "We zijn een dag gaan meelopen op de werkvloer om hun dagelijkse realiteit te begrijpen. We merkten dat de weerstand voortkwam uit de angst dat de nieuwe software hun administratieve last zou verhogen. Door hen te betrekken bij de co-creatie van de interface-sjablonen, hebben we hun weerstand omgezet in actieve betrokkenheid en eigenaarschap. De teamleiders zijn nu ambassadeurs van het project geworden." },
      { timestamp: "03:10", speaker: "Student 1", text: "Tijdens dit meelopen stuitten we op een intercultureel issue. De helpdesk is deels uitbesteed aan een team in India. Er was veel onbegrip over de communicatiestijl: de Nederlandse collega's vonden de Indiase reacties vaag, terwijl de Indiase collega's de Nederlandse directheid als beledigend ervoeren. We hebben Hofstede's dimensie 'Individualisme vs Collectivisme' en de 'Low vs High Context' communicatie van Erin Meyer toegepast om workshops te geven voor beide teams. Dit heeft de ticketsnelheid met 35% verbeterd." },
      { timestamp: "04:15", speaker: "Examinator", text: "Fantastisch resultaat. Dit is een buitengewoon hoogwaardige en professionele aanpak!" }
    ],
    analysis: {
      scores: {
        "Student 1": { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3 },
        "Student 2": { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3 }
      },
      tags: {
        "Student 1": {
          1: ["diepgaande analyse", "concepten verbonden"],
          2: ["leidt het gesprek", "vloeiende argumentatie"],
          3: ["synergie gecreëerd", "verbinding gemaakt", "weerstand omgebogen"],
          4: ["diepgaande zelfanalyse", "proactieve leergreep"],
          5: ["diep cultureel inzicht", "cultuur specifieke synergie"],
          6: ["analyseert moreel aspect"]
        },
        "Student 2": {
          1: ["diepgaande analyse", "concepten verbonden", "eigenstandige toepassing"],
          2: ["leidt het gesprek", "vloeiende argumentatie"],
          3: ["synergie gecreëerd", "verbinding gemaakt", "weerstand omgebogen"],
          4: ["diepgaande zelfanalyse", "proactieve leergreep", "leiderschap in team"],
          5: ["diep cultureel inzicht", "cultuur specifieke synergie"],
          6: ["analyseert moreel aspect"]
        }
      },
      reasoning: {
        "Student 1": {
          1: "Student 1 verbindt ADKAR vloeiend met Lewin en bewijst diepe bedrijfskundige theoriebeheersing.",
          3: "Toont uitstekende samenwerking en creëert actieve synergie uit weerstand door co-creatie.",
          5: "Past Erin Meyer en Hofstede op indrukwekkende en effectieve wijze toe om een reële bedrijfsknelpunt op te lossen."
        },
        "Student 2": {
          1: "Student 2 past ADKAR-methode zeer professioneel toe, startend met een gedegen nulmeting.",
          3: "Student 2 toont uitmuntende verbinding door haar inlevend meelopen op de werkvloer.",
          5: "Ontwikkelt concrete, cultuursensitieve synergie die de operationele prestaties met 35% verhoogt."
        }
      },
      feedback: {
        "Student 1": {
          strengths: [
            "Indrukwekkende integratie en synthese van complexe theorieën.",
            "Zeer volwassen, strategische blik op consultancy en verandervraagstukken.",
            "Overtuigende en vloeiende communicatiestijl."
          ],
          improvements: [
            "Blijf deze hoge standaard vasthouden in je verdere professionele loopbaan."
          ]
        },
        "Student 2": {
          strengths: [
            "Uitstekend empirisch onderzoek (meeloop-methode) gebruikt als basis voor verandering.",
            "Sterk leiderschap en proactiviteit getoond om de helpdesk-integratie vlot te trekken.",
            "Zeer resultaatgericht zonder de menselijke factor uit het oog te verliezen."
          ],
          improvements: [
            "Blijf jezelf uitdagen met nog complexere strategische dillema's."
          ]
        }
      }
    }
  }
};

// API Endpoint for simulation data
app.post("/api/simulate-analysis", (req, res) => {
  const { scenarioId } = req.body;
  const scenario = SIMULATION_SCENARIOS[scenarioId as keyof typeof SIMULATION_SCENARIOS];
  if (!scenario) {
    return res.status(404).json({ error: "Scenario niet gevonden" });
  }
  return res.json(scenario);
});

// API Endpoint to Analyze transcription text or audio base64 with Gemini
app.post("/api/analyze-assessment", async (req, res) => {
  const { audioData, mimeType, transcriptText, student1Name, student2Name } = req.body;
  const s1 = (student1Name || "Student 1").trim();
  const rawS2 = (student2Name || "").trim();
  const isSolo = rawS2.length === 0;
  const s2 = isSolo ? null : rawS2;

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful Fallback if API key is not configured or available yet
    console.log("Gemini API Client is not configured. Falling back to simulated response.");
    let selectedScenario = SIMULATION_SCENARIOS.scenario_a;
    if (transcriptText && transcriptText.toLowerCase().includes("adkar")) {
      selectedScenario = SIMULATION_SCENARIOS.scenario_c;
    } else if (transcriptText && transcriptText.toLowerCase().includes("stakeholder")) {
      selectedScenario = SIMULATION_SCENARIOS.scenario_b;
    }
    
    // Customize fallback names
    const fallbackData = JSON.parse(JSON.stringify(selectedScenario));
    // Simple custom mapping if names are supplied
    if (student1Name && student2Name) {
      const origKeys = Object.keys(fallbackData.analysis.scores);
      const renameMap: Record<string, string> = {
        [origKeys[0]]: s1,
        [origKeys[1]]: rawS2
      };
      
      const renameObj = (obj: any) => {
        if (!obj) return obj;
        const newObj: any = {};
        for (const k of Object.keys(obj)) {
          const newK = renameMap[k] || k;
          newObj[newK] = obj[k];
        }
        return newObj;
      };

      fallbackData.analysis.scores = renameObj(fallbackData.analysis.scores);
      fallbackData.analysis.tags = renameObj(fallbackData.analysis.tags);
      fallbackData.analysis.reasoning = renameObj(fallbackData.analysis.reasoning);
      fallbackData.analysis.feedback = renameObj(fallbackData.analysis.feedback);
      
      fallbackData.transcript = fallbackData.transcript.map((item: any) => {
        let text = item.text;
        text = text.replace(new RegExp(origKeys[0], "g"), s1);
        text = text.replace(new RegExp(origKeys[1], "g"), rawS2);
        let s = item.speaker;
        if (s === origKeys[0]) s = s1;
        if (s === origKeys[1]) s = rawS2;
        return { ...item, speaker: s, text };
      });
    }

    return res.json({
      success: true,
      simulated: true,
      analysis: fallbackData.analysis,
      transcript: fallbackData.transcript,
      message: "Analyse voltooid via simulatie (Gemini API sleutel is momenteel niet geconfigureerd)."
    });
  }

  try {
    const deelnemerIntro = isSolo
      ? `In dit assessmentgesprek (ca. 20 minuten) neemt ÉÉN student deel, samen met een examinator.
De vermoedelijke naam van de student op basis van de deelnemerslijst is: "${s1}". Gebruik deze naam UITSLUITEND als hint om de spreker te herkennen.`
      : `In dit assessmentgesprek (ca. 20 minuten) nemen TWEE studenten deel, samen met een examinator.
De vermoedelijke namen van de studenten op basis van de deelnemerslijst zijn: "${s1}" en "${s2}". Gebruik deze namen UITSLUITEND als hint om de sprekers te herkennen.`;

    const scoreSleutels = isSolo ? `["${s1}"]` : `["${s1}", "${s2}"]`;

    let prompt = `Je bent een ervaren bedrijfskundig beoordelaar (sr. docent) voor het PROMEF Midterm Assessment aan de HAN Bedrijfskunde.
${deelnemerIntro}

BELANGRIJK — trouw aan de audio:
- Baseer de transcriptie UITSLUITEND op wat daadwerkelijk in de audio/tekst te horen is. Verzin GEEN extra sprekers, dialoog of deelnemers die er niet zijn.
- Hoor je maar één student, rapporteer dan ook maar één student. Vul nooit een tweede student aan om een duo-format te vullen.
- De "speaker"-labels in het transcript reflecteren de werkelijk gehoorde naam/rol (bv. "Examinator" of de echte studentnaam). Gebruik een naam uit de deelnemerslijst alleen wanneer die overeenkomt met de gehoorde spreker.
- LET OP: ongeacht de sprekerlabels in het transcript, gebruik in "scores", "tags", "reasoning", "quotes" en "feedback" exact deze objectsleutel(s): ${scoreSleutels}.

Analyseer de input en geef een gedetailleerde beoordeling over de 6 beoordelingscriteria:
1. Veranderen en evalueren
2. Sociaal communicatieve vaardigheden
3. Schakelen en verbinden
4. Professionaliseren (bijdrage)
5. Professionaliseren (intercultureel)
6. Handelen vanuit waarden

Voor elk criterium kan een student gescoord worden op: "Onder", "Op", "Boven" of "Excellent" (deze vertalen naar 1, 2, 3 of 4 punten respectievelijk).

Wees kritisch maar rechtvaardig en baseer je oordeel op de verstrekte discussie.
Let op:
- Alle criteria moeten minimaal "Op" (2) zijn om te slagen.
- Selecteer voor elk criterium ook toepasbare observatie-tags uit de volgende lijst (maximaal 2-3 tags per niveau):
  Criterium 1: "geen theorie", "concept onjuist", "niet uitgelegd", "concept benoemd", "basisuitleg", "beperkt voorbeeld", "helder uitgelegd", "theorie correct", "goed voorbeeld", "diepgaande analyse", "concepten verbonden", "eigenstandige toepassing"
  Criterium 2: "luistert niet", "onduidelijk verhaal", "onderbreekt duo", "actief luisterend", "vloeiende argumentatie", "sterke interactie", "leidt het gesprek", "professionele toon", "vraagt goed door"
  Criterium 3: "negeert weerstand", "gaat in verdediging", "erkent weerstand", "luistert naar argument", "verbinding gemaakt", "weerstand omgebogen", "synergie gecreëerd", "belangen benoemd"
  Criterium 4: "geen procesreflectie", "leert niet van feedback", "reflecteert oppervlakkig", "toont basale groei", "feedback toegepast", "sterke reflectie", "toont concrete groei", "diepgaande zelfanalyse"
  Criterium 5: "negeert cultuurverschil", "bevooroordeeld", "herkent cultuurfactor", "respectvolle houding", "concept geanalyseerd", "overbrugt cultuurkloof", "diep cultureel inzicht", "cultuur specifieke synergie"
  Criterium 6: "negeert integriteit", "geen ethisch besef", "herkent moreel dillema", "noemt OOA gedragscode", "analyseert moreel aspect", "beargumenteert afweging", "moreel kompas getoond", "stelt integriteit centraal"

- Vul voor "quotes" per student per criterium (1 t/m 6) een KORTE, LETTERLIJKE uitspraak in (max ~1 zin) uit de eigen woorden van die student die de score voor dat criterium het best onderbouwt. Gebruik UITSLUITEND wat de student daadwerkelijk zei; verzin niets. Behandelde de student dat criterium niet, gebruik dan een lege string "". Elk criterium moet zijn eigen, passende quote krijgen (niet steeds dezelfde zin herhalen).

Als input krijg je ofwel een transcriptie-tekst, ofwel een audiobestands-inline-data.`;

    if (transcriptText) {
      prompt += `\n\nHier is de transcriptietekst van de discussie:\n"""\n${transcriptText}\n"""`;
    }

    const contents: any[] = [];
    if (audioData && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: audioData
        }
      });
      prompt += `\n\nAnalyseer dit geüploade audiobestand waarin de deelnemer(s) en de examinator praten. Transcribeer het eerst mentaal of schets de rode draad, en voer daarna de beoordeling uit.`;
    }
    contents.push(prompt);

    // Build the per-student leaf schemas once, then assemble keyed objects
    // for exactly the students that are actually present (1 for solo, 2 for duo).
    // This prevents the model being forced to fabricate a second student.
    const studentNames: string[] = isSolo ? [s1] : [s1, s2 as string];

    const sixIntegerObj = {
      type: Type.OBJECT,
      properties: {
        "1": { type: Type.INTEGER },
        "2": { type: Type.INTEGER },
        "3": { type: Type.INTEGER },
        "4": { type: Type.INTEGER },
        "5": { type: Type.INTEGER },
        "6": { type: Type.INTEGER }
      },
      required: ["1", "2", "3", "4", "5", "6"]
    };
    const sixStringArrObj = {
      type: Type.OBJECT,
      properties: {
        "1": { type: Type.ARRAY, items: { type: Type.STRING } },
        "2": { type: Type.ARRAY, items: { type: Type.STRING } },
        "3": { type: Type.ARRAY, items: { type: Type.STRING } },
        "4": { type: Type.ARRAY, items: { type: Type.STRING } },
        "5": { type: Type.ARRAY, items: { type: Type.STRING } },
        "6": { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["1", "2", "3", "4", "5", "6"]
    };
    const sixStringObj = {
      type: Type.OBJECT,
      properties: {
        "1": { type: Type.STRING },
        "2": { type: Type.STRING },
        "3": { type: Type.STRING },
        "4": { type: Type.STRING },
        "5": { type: Type.STRING },
        "6": { type: Type.STRING }
      },
      required: ["1", "2", "3", "4", "5", "6"]
    };
    const feedbackObj = {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "improvements"]
    };

    // Turn a per-student leaf into an object keyed by the present student names.
    const byStudent = (leaf: any) => ({
      type: Type.OBJECT,
      properties: Object.fromEntries(studentNames.map((n) => [n, leaf])),
      required: studentNames
    });

    const schema = {
      type: Type.OBJECT,
      properties: {
        transcript: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: { type: Type.STRING },
              speaker: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["speaker", "text"]
          },
          description: "Een representatieve, ingekorte transcriptie of reconstructie van de discussie in het Nederlands"
        },
        analysis: {
          type: Type.OBJECT,
          properties: {
            scores: byStudent(sixIntegerObj),
            tags: byStudent(sixStringArrObj),
            reasoning: byStudent(sixStringObj),
            quotes: byStudent(sixStringObj),
            feedback: byStudent(feedbackObj)
          },
          required: ["scores", "tags", "reasoning", "quotes", "feedback"]
        }
      },
      required: ["transcript", "analysis"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "Je bent een objectieve, professionele examinator van de HAN Bedrijfskunde. Je spreekt Nederlands en levert strikt gestructureerde data op in JSON formaat die aansluit bij de rubrics van het PROMEF-assessment.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Geen antwoord van Gemini");
    }

    const analyzedData = JSON.parse(resultText.trim());
    return res.json({
      success: true,
      simulated: false,
      analysis: analyzedData.analysis,
      transcript: analyzedData.transcript || []
    });

  } catch (error: any) {
    console.error("Fout in Gemini API analyse:", error);
    return res.status(500).json({
      error: "Analyse mislukt",
      details: error.message || error
    });
  }
});
