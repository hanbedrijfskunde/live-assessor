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
