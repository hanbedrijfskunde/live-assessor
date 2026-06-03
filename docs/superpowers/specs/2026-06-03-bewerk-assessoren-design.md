# Ontwerp: Assessoren bewerken bij bestaande groepen

**Datum:** 2026-06-03
**Status:** Voorgesteld — wacht op review

## Probleem

Assessoren (in PROMEF: de docenten die beoordelen) kunnen op dit moment **alleen
bij het aanmaken** van een groep worden ingevoerd, via het komma-gescheiden veld in het
"Nieuwe Klas / Groep"-formulier ([StudentManager.tsx:122-131](../../../src/components/StudentManager.tsx#L122-L131)).
Daarna is er geen enkele manier om een assessor toe te voegen, te wijzigen of te verwijderen.

Bovendien worden de assessoren in de groepenlijst van het Studenten-scherm **helemaal niet
getoond** — alleen datum/tijd/slotduur. In de kalender staan ze wél, maar uitsluitend als
read-only badge in de groepheader ([CalendarOverview.tsx:138-142](../../../src/components/CalendarOverview.tsx#L138-L142)).

## Doel

De docent kan de assessoren van een bestaande groep beheren (toevoegen / verwijderen)
vanuit twee plekken:

1. De groepkaart in de lijst "Geregistreerde Groepen & Deelnemers" (Studenten-scherm).
2. De assessoren-badge in de kalenderheader.

Beide gebruiken dezelfde onderliggende callback en dezelfde inline bewerk-interactie.

**Out of scope (YAGNI):** geen herordening van assessoren, geen aparte rollen
(examinator/assessor), geen bewerken van datum/tijd/slotduur in deze iteratie (de callback
wordt wel generiek opgezet zodat dat later kan).

## Terminologie

De hele app gebruikt consequent het woord **"Assessoren"** (formulier, kalender, A4-rapport).
We behouden dit label. Het datamodelveld blijft `Groep.assessoren: string[]`.

## Architectuur

Volgt de bestaande unidirectionele dataflow: `App` houdt state + persistentie, views krijgen
data en callbacks als props en muteren nooit zelf localStorage.

### 1. Datalaag — `App.tsx`

Nieuwe handler:

```ts
const handleUpdateGroep = (groepId: string, patch: Partial<Groep>) => {
  const next = groepen.map(g => (g.id === groepId ? { ...g, ...patch } : g));
  updateAndSaveGroepen(next);
};
```

- Generiek (`Partial<Groep>`) zodat latere velden hergebruik mogelijk maken; in deze iteratie
  wordt enkel `{ assessoren }` doorgegeven.
- Doorgegeven als prop `onUpdateGroep` naar zowel `StudentManager` als `CalendarOverview`.

### 2. Herbruikbaar component — `AssessorenEditor`

Eén klein, op zichzelf testbaar component dat de bewerk-interactie bevat, zodat beide views
identiek gedrag krijgen.

**Locatie:** `src/components/AssessorenEditor.tsx`

**Props:**
```ts
interface AssessorenEditorProps {
  assessoren: string[];
  onChange: (next: string[]) => void; // de view roept hiermee onUpdateGroep(groepId, { assessoren: next })
}
```

**Gedrag:**
- Rendert elke assessor als chip met een ✕-knop die hem uit de array verwijdert.
- Klein tekstveld + "+"-knop; Enter of klik voegt de getrimde waarde toe.
- Lege/whitespace invoer wordt genegeerd; duplicaten (case-insensitive, getrimd) worden
  geweigerd.
- Lege lijst toont de placeholdertekst "Nog geen assessoren".
- Het component houdt zelf alleen de tekst van het invoerveld als lokale state bij; de lijst
  zelf is volledig gestuurd door de `assessoren`-prop (controlled).

### 3. Primaire plek — groepkaart (`StudentManager.tsx`)

In de kaart "Geregistreerde Groepen & Deelnemers", onder de bestaande groepheader (naam +
datum/tijd + verwijderknop), komt een **Assessoren-regel** met daarin de `AssessorenEditor`.
`onChange` roept `onUpdateGroep(groep.id, { assessoren: next })`.

Nieuwe prop op `StudentManager`: `onUpdateGroep: (groepId: string, patch: Partial<Groep>) => void`.

### 4. Secundaire plek — kalenderheader (`CalendarOverview.tsx`)

De bestaande read-only badge "Assessoren: …" wordt klikbaar. `CalendarOverview` krijgt één
viewniveau-state `editingGroepId: string | null` (max. één geopende editor tegelijk). Een klik op
de badge zet `editingGroepId` op die groep en toont de `AssessorenEditor`; een "klaar"-knop zet
hem terug op `null` en toont weer de badge.

Nieuwe prop op `CalendarOverview`: `onUpdateGroep: (groepId: string, patch: Partial<Groep>) => void`.

## Dataflow

```
StudentManager / CalendarOverview
        │  onChange(next)
        ▼
   onUpdateGroep(groepId, { assessoren: next })   (prop)
        │
        ▼
App.handleUpdateGroep  →  updateAndSaveGroepen  →  setState + localStorage("promef_groepen")
        │
        ▼  (props omlaag)
   bijgewerkte groepen → beide views re-renderen met nieuwe assessoren
```

## Foutafhandeling / randgevallen

- Lege of whitespace-only naam: niet toevoegen.
- Duplicaat (case-insensitive, getrimd): niet toevoegen.
- Laatste assessor verwijderen is toegestaan → lege lijst met placeholder.
- Geen bevestigingsdialoog nodig voor verwijderen van één assessor (lage impact, makkelijk te
  herstellen door opnieuw toe te voegen) — anders dan groep/team verwijderen.

## Tests

Component-/integratietests (Vitest + Testing Library), in lijn met de F3/F4-conventies:

- `AssessorenEditor`: toevoegen via Enter en via +-knop; verwijderen via ✕; duplicaat geweigerd;
  lege invoer genegeerd; lege staat toont placeholder.
- `StudentManager`: groepkaart toont assessoren-chips; toevoegen/verwijderen roept
  `onUpdateGroep` met de juiste `{ assessoren }`-payload.
- `CalendarOverview`: badge klikbaar → editor verschijnt; wijziging roept `onUpdateGroep`.

`npm test` + `tsc --noEmit` groen; relevante e2e/smoke ongebroken.

## Documentatie

- `BLUEPRINT.html`: F3 (StudentManager) en F4 (CalendarOverview) bijwerken — assessoren zijn nu
  bewerkbaar; nieuw `AssessorenEditor`-component opnemen in de componentenlijst en dataflow;
  `onUpdateGroep`-arrow toevoegen. Stale framing verwijderen (assessoren niet langer alleen bij
  aanmaken).
- `CHANGELOG.md`: nieuwe entry bovenaan met **Verbeteringen** + **Lessen**; versie-tag in
  blueprintheader gelijktrekken.
