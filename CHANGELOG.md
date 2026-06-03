# Changelog

Wijzigingslog van de PROMEF Assessment Tool & AI Notulist — **append-only, nieuwste bovenaan**.

Dit bestand is het tegenhanger-artefact van `BLUEPRINT.html`:

- **`BLUEPRINT.html`** beschrijft de *huidige toestand* van de app (geen legacy). De `v…`-tag in de
  header van de blueprint loopt gelijk met de bovenste entry hieronder.
- **`CHANGELOG.md`** (dit bestand) bewaart de *geschiedenis*: wat er per versie veranderde en welke
  lessen daarbij ontstonden, mét context en "waarom".

**Per entry:**

- **Verbeteringen** — wat er veranderde en waarom (niet alleen het wat).
- **Lessen** — wat we leerden en in welke situatie dat ons verraste. Een nog-geldende les wordt
  gedestilleerd tot een kale regel in de sectie *Geleerde conventies* van `BLUEPRINT.html`; de
  `→ Geleerde conventie:`-regel hieronder is de brug tussen het verhaal (hier) en de regel (daar).

---

## v1.8 — 2026-06-03 · F8 (resultatenmatrix) onder test

De slaag/zak-logica en de cijferberekening komen samen in de resultatenmatrix; dit is de plek waar de
PROMEF-exameneis ("alle criteria minimaal Op") zichtbaar wordt voor de docent.

### Verbeteringen

- **F8 — ResultsView** (`tests/component/ResultsView.test.tsx`): één "Onder" (1) levert "Gezakt" op
  ondanks een slagend cijfer (de criteria-eis weegt zwaarder dan het puntentotaal); onvolledig →
  "Deels"/"Onvolledig"; volledig zonder 1 → "Geslaagd"; en de CSV-export bouwt een rij met naam, zes
  scores, totaal, cijfer en statuslabel.

### Lessen

- De CSV-export gaat via `downloadCSV` (DOM-`<a>` + `URL.createObjectURL`), lastig direct te testen.
  Door alléén die ene functie te mocken bleef de rest van `utils` echt en kon het `rows`-argument
  geïnspecteerd worden.
  → Geleerde conventie: mock één named export met
  `vi.mock(pad, async (importOriginal) => ({ ...await importOriginal(), naam: vi.fn() }))`.

---

## v1.7 — 2026-06-03 · F7 (backend & Gemini-audioanalyse) onder test

De backend-kern was al in F0 getest (de server-split werd daar bewezen). F7 vult de twee resterende
ongeteste paden aan: de keyword-gestuurde fallbackselectie en de frontend audio-upload-keten.

### Verbeteringen

- **Fallback-scenarioselectie** (`tests/api/analyze-assessment.test.ts`): zonder API-key kiest de
  server een scenario op trefwoord in het transcript — `ADKAR`→C, `stakeholder`→B, anders→A. Na de
  naam-remap is dat herkenbaar aan student-1's criterium-1-score (4/2/3).
- **Audio-upload-pad** (`tests/component/AiNotulistPanel.test.tsx`): een geüpload audiobestand wordt
  naar `/api/analyze-assessment` gePOST (gemockte `fetch`) en het teruggegeven transcript rendert.

### Lessen

- Een visueel verborgen file-input (`display:none`) wordt door `userEvent.upload` geweigerd; de upload
  bereikte de handler nooit.
  → Geleerde conventie: zet `files` via `Object.defineProperty` en dispatch `fireEvent.change`; mock
  `fetch` voor het upload→API-pad.
- De teruggegeven transcriptregel verschijnt twee keer in de UI — in de transcriptkolom én als quote in
  de competentie-feed — waardoor `findByText` op "multiple elements" brak. `findAllByText` + een
  lengte-check is dan de juiste assertie (variant op de bestaande "uniek anker"-conventie).

---

## v1.6 — 2026-06-03 · F6 (AI-simulatie) onder test

De client-side AI-simulatie (`buildSimulation`) is de motor achter de drie scoreprofiel-knoppen.
Die logica is nu rechtstreeks getest, plus de afspeel- en apply-bedrading van het paneel.

### Verbeteringen

- **F6 — AiNotulistPanel:** `buildSimulation` geëxporteerd en met unittests gedekt
  (`tests/unit/buildSimulation.test.ts`): patroon→score (`onvoldoende`=1, `uitstekend`=4,
  `random`∈{2,3,4}), keying op de echte teamnamen (solo én trio), het aantal transcript-regels en
  competentie-detecties, en gevulde tags/reasoning/feedback per student.
- **Apply-bedrading** (`tests/component/AiNotulistPanel.test.tsx`): de drie knoppen tonen de
  teamnaam; een `onvoldoende`-run speelt af en "Gebruik AI Suggesties" levert all-Onder-scores aan
  `onApplySuggestions`.

### Lessen

- De simulatie speelt het transcript regel-voor-regel af via `setInterval`; de apply-knop verschijnt
  pas ná de laatste tick. Een gewone klik-test ziet die knop dus nooit.
  → Geleerde conventie: test timer-gestuurde UI met `vi.useFakeTimers()` +
  `act(() => vi.advanceTimersByTime(...))`, en gebruik `fireEvent` (niet `userEvent`) zolang nep-timers
  actief zijn.

---

## v1.5 — 2026-06-03 · Persoonsnamen uit de code; demo via CSV

Studentvoornamen (17), docent/assessor-namen (Sonia, Mark, Jan) en volledige beoordelingsnotities
mét namen stonden hard in de broncode (`src/utils.ts` seed + `app.ts` AI-fallback). Ook als "mock"
hoort persoonsdata niet in source/git. Alle namen zijn nu uit de code; de demo-roster verhuisde naar
een los databestand dat als demo wordt ingelezen.

### Verbeteringen

- **Demo-roster naar `public/demo.csv`** (nieuw): `Student;Groep;Team`. "Laad Voorbeeldset" haalt het
  op met `fetch` en parseert het via de bestaande `parseCSV` → verse, *ongescoorde* cohort. `Baran`
  vervangen door **Emre** (op verzoek een andere Turkse naam).
- **`src/utils.ts`:** `INITIAL_GROEPEN/TEAMS/STUDENTEN/ASSESSMENTS` (incl. naam-bevattende notities)
  verwijderd; `parseCSV`-default `assessoren` → `[]` (was `["Sonia","Mark"]`). Ongebruikte imports
  (`CRITERIA`, `TeamAssessment`) opgeschoond.
- **`src/App.tsx`:** load-on-mount valt terug op lege `[]`/`{}` (geen code-seed) → verse app start
  leeg; `handleLoadExampleData` is nu async en laadt `/demo.csv` via `handleImportData`.
- **`app.ts`:** de drie AI-fallback-scenario's gebruiken neutrale placeholders `Student 1`/`Student 2`
  (keys nu gequote) i.p.v. echte namen; de runtime-remap vult alsnog de echte namen in.
- **UI/teksten:** DataManager-knop async + foutafhandeling, voorbeeld-CSV-preview en
  StudentManager-placeholders/defaults naamloos; `types.ts`-comment-voorbeeld geneutraliseerd.
- **Tests/e2e:** CSV-unittests, component- en integratiefixtures naamloos; de integratietest seedt nu
  zelf een mini-fixture in `localStorage` (geen auto-seed meer); de e2e laadt eerst de demo en gebruikt
  de parser-afgeleide team-id `t-g-bknf02-4`. Alles groen (48 unit/component/integration/api + 2 e2e).

### Lessen

- Een demo die *roster + scores* toont past niet in één CSV: `parseCSV` draagt alleen de roster, en
  CSV-gegenereerde id's (`t-<groepId>-<nr>`) lijnen niet uit met losse, voorgescoorde assessments.
  Keuze: roster-only demo, voorgescoorde `INITIAL_ASSESSMENTS` vervalt.
- Naamtokens met een spatie (`Student 1`) zijn geen geldige *unquoted* objectsleutels. Bij het
  genericeren van `app.ts` moesten de shorthand-keys eerst gequote worden (`"Student 1":`) vóór de
  globale vervanging — anders breekt de syntax.
- Auto-seed weghalen breekt elke test die op mount-data leunde. Tests die data nodig hebben moeten die
  expliciet zelf zetten (localStorage-fixture) i.p.v. op een impliciete code-seed te vertrouwen.
  → Geleerde conventie: geen echte persoonsnamen in broncode/fixtures; demo-roster in `public/demo.csv`,
  lege `assessoren`-defaults, AI-fallback met `Student 1`/`Student 2`, verse app start leeg.

---

## v1.4 — 2026-06-03 · Blueprint: legacy/retrofit-framing weggesneden

De blueprint droeg twee identiteiten door elkaar: een *bouwspec* (hoe bouw je de app) én een
*retrofit-test-tracker* (wat bestond al, welke tests zijn toegevoegd). De tweede is geschiedenis en
hoort hier in de changelog, niet in de present-tense reference. Een lezer die de laatste versie wil
bouwen had niets aan "component bestond al" of "TOEGEVOEGD IN F0".

### Verbeteringen

- **Deel A ontdaan van fase-/retrofit-tags:** koppen "package.json scripts" en "Test-dependencies"
  verloren hun `✅ AANWEZIG (F0)` / `✅ TOEGEVOEGD IN F0`-pills; de zin "stonden niet in de originele
  app …" is weg; "Testbaarheid (gerealiseerd in F0)" → present-tense "Testbaarheid"; "Bestandsstructuur
  (doel)" → "Bestandsstructuur"; "Geleerde conventies (gerealiseerd)" → "Geleerde conventies".
- **Dead reference hersteld:** de bestandsboom miste `tests/component/` en `tests/integration/` terwijl
  beide bestaan en in de fase-kaarten worden genoemd — nu toegevoegd.
- **Deel B Status-regels opgeschoond:** de `✅ GEREALISEERD`-pills blijven (toegestane status-markering),
  maar de retrofit-prozá ("Component bestond al", "tests toegevoegd", "geen functionele wijziging nodig",
  "N tests groen") is verwijderd. De drie herbruikbare NB-testtips (F2: echte views + stubs; F3: select
  zonder label via optie; F4: jsdom drag-&-drop via `fireEvent.drop`) blijven behouden als present-tense
  **Testnotitie**.

### Lessen

- "Markeer een gerealiseerde fase met een status-regel" (CLAUDE.md) is niet hetzelfde als "plak de
  hele retrofit-historie in de fase-kaart". De *pill* markeert; de *prozá* moet present-tense bouwkennis
  blijven, niet een dagboek van wat-al-bestond. Onderscheid bij het opschonen scherp tussen een
  herbruikbare testtip (blijft) en een voltooiingsverslag (gaat naar de changelog).
- Reference-secties kunnen stil verouderen op detailniveau: de bestandsboom liep achter op de echte
  testmappen. Bij het schrappen van legacy ook actief checken of de reference de *huidige* werkelijkheid
  nog volledig dekt, niet alleen of er niets te véél staat.

---

## v1.3 — 2026-06-03 · Blueprint: het API-key-moment expliciet gemaakt

De blueprint beschreef *dat* er een `GEMINI_API_KEY` is en *waar* die als bestand staat, maar nergens
*wanneer* de developer hem moet invoeren. Een lezer kon daardoor niet uit de blueprint afleiden of de
sleutel een verplichte opstartstap was of optioneel.

### Verbeteringen

- **A8 (API):** een alinea "Wanneer & waar de sleutel invoeren" toegevoegd — de key is optioneel
  (zonder = fallback), en voor echte Gemini-analyse kopieer je `.env.example` → `.env` en vul je hem
  in *vóór* `npm run dev`/`npm start`. `dotenv` leest `.env` alleen bij opstart, dus na invullen moet
  de dev-server herstarten. Expliciet vermeld dat er geen UI-veld is; de sleutel hoort server-side.
- **Bestandsboom:** `.env` en `.env.example` als twee aparte regels — `.env.example` (in git, sjabloon)
  vs. `.env` (gitignored, ingevulde kopie) — i.p.v. één dubbelzinnige regel.

### Lessen

- "Waar staat config" en "wanneer voer je config in" zijn twee verschillende vragen; de blueprint
  beantwoordde alleen de eerste. Bij optionele config met een graceful fallback is er geen hard
  faal-moment dat de developer naar de instructie dwingt, dus moet het moment expliciet beschreven
  staan, anders ontdekt niemand het.
  → Geleerde conventie: documenteer voor optionele config naast het bestaan ook het moment (vóór
  opstart, herstart nodig) en de plek (server-side `.env`, geen UI-veld).

---

## v1.2 — 2026-06-03 · F5 (scoringskern) onder test

De kern van de applicatie — het beoordelingsformulier — onder test gebracht, met de eerste
end-to-end-deelreis als bewijs dat de hele keten (scoren → status → kalender) klopt.

### Verbeteringen

- **F5 — AssessmentView:** componenttests voor het beoordelingshart: score zetten → status
  `partial`, alle 6 criteria → `completed`, een score wissen → terug naar `partial`,
  duo-score-replicatie met read-only gesynchroniseerde medestudent, observatie-tag toggle
  (`✓ tag`-regel toevoegen/verwijderen) en per-student reset (incl. uitgeschakeld bij lege student).
- **Eerste E2E-deelreis** (`e2e/assessment.spec.ts`): open het solo-team, scoor alle zes criteria
  en controleer dat de kalenderkaart op "Voltooid" springt — de eerste test die de volledige
  gebruikersketen door de echte app heen aflegt.

### Lessen

- Niveau-labels als "Op"/"Boven" bestaan in het scherm twee keer: als kop van een tag-groep
  (`<span>`) én als scoreknop (`<button>`); een `getByText` is dan dubbelzinnig. In een duo
  renderen bovendien beide studenten identieke knoppen.
  → Geleerde conventie: query controls met `getByRole("button", …)`, en bij identieke controls over
  meerdere kaarten met `getAllByRole(...)` + positie-index.

---

## v1.1 — 2026-06-03 · F0–F4 gerealiseerd (baseline)

Eerste vastgelegde versie. De app bestond al; vanaf hier wordt ze fase voor fase onder test
gebracht volgens `BLUEPRINT.html`. Deze entry vat samen waar het project nu staat.

### Verbeteringen

- **F0 — Harness & server-split:** projectscaffold, build- en testharness opgezet. `app.ts`
  (Express-app + injecteerbare Gemini-client, geen `listen`) gesplitst van `server.ts`
  (Vite-middleware/static + `listen`), zodat de backend testbaar werd zonder netwerk of poort.
- **F1 — Domein & utils:** volledige unit-dekking voor `src/types.ts` (criteria, score→level,
  `getCijferFromScore`) en `src/utils.ts` (tijdslot-rekenwerk, CSV-parse, export, localStorage).
- **F2 — App-shell:** integratietests voor `App` + view + localStorage samen.
- **F3 — StudentManager:** componenttests voor studentbeheer.
- **F4 — CalendarOverview:** componenttests voor het kalenderoverzicht.

### Lessen

- API-tests bleken niet in de standaard jsdom-omgeving te kunnen draaien nadat Vitest 4
  `environmentMatchGlobs` verwijderde.
  → Geleerde conventie: API-tests draaien in Node via een per-bestand docblock
  `// @vitest-environment node`.
- API-tests moesten zonder netwerk kunnen draaien én het fallback-pad forceren.
  → Geleerde conventie: de Gemini-client is injecteerbaar
  (`setGeminiClientForTesting` / `resetGeminiClientForTesting`).
- jsdom's `localStorage` was onbetrouwbaar onder Vitest, en `App`-integratietests struikelden over
  browser-dialogen.
  → Geleerde conventie: gebruik een in-memory `Storage`-stub i.p.v. jsdom, en stub
  `confirm`/`alert` voor `App`-integratie.
- Namen als "BKN-F01" kwamen in een view meervoudig voor (kaart + `<option>`s), waardoor
  `getByText` brak.
  → Geleerde conventie: query op een uniek anker (bv. een
  `getAllByTitle("Verwijder groep")`-telling) i.p.v. `getByText`.
