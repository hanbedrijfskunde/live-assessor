# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Keep the blueprint current — no legacy descriptions

`BLUEPRINT.html` is the authoritative, self-contained specification for this application and must
**always describe the current state of the app**. After every change to the code, update
`BLUEPRINT.html` in the same change. A code change is not complete until the blueprint reflects it.

"Current" means more than appending — actively **remove or rewrite anything that no longer holds**:

- **No stale framing.** When a planned item is realized, move its reference text from future to
  present tense ("toe te voegen" / "te bouwen" / "splits X" → done), and mark the phase realized.
- **No dead references.** Remove diagram arrows, endpoints, files, props, or dependencies that no
  longer exist or are no longer used (e.g. a UI→endpoint arrow for a call the client dropped, or a
  dependency that is installed but not imported — describe it as such, don't imply it's active).
- **Keep both diagram registers honest.** Every Mermaid block exists twice (source + rendered);
  update both, and keep the prose around it consistent with the picture.
- **Reference vs plan.** The architecture/stack/data sections (Deel A) are present-tense reference
  and must match reality now. The phase cards (Deel B) are the plan; mark realized phases with a
  status line, but don't let realized reality contradict the recipe text.

> The blueprint is maintained as `BLUEPRINT.html` only (HTML with embedded Mermaid — each diagram
> appears both rendered and as copyable source). There is no Markdown variant; do not create one.

## 📓 Record history in `CHANGELOG.md` — the blueprint's counterpart

`BLUEPRINT.html` holds the *current state* (no legacy); `CHANGELOG.md` holds the *history*. They are
two artefacts with opposite jobs — never put a dated wijzigingslog inside the blueprint.

**On every version bump:** add a new entry at the top of `CHANGELOG.md` (newest first) with two
subsections — **Verbeteringen** (what changed and *why*) and **Lessen** (what was learned and the
situation that surprised us). Keep the `v…`-tag in the blueprint header equal to the top changelog
entry.

**Lessons flow one way.** The changelog tells the dated story with context; distil any *still-valid*
lesson into a bare rule in the *Geleerde conventies* block of `BLUEPRINT.html`. Mark that bridge in
the changelog with a `→ Geleerde conventie:` line. The blueprint carries the rule (no dates); the
changelog carries the why. Do not duplicate the full lesson in both places.

## Commands

```bash
npm run dev          # Express + Vite middleware on http://localhost:3000 (tsx server.ts)
npm run build        # vite build (frontend) + esbuild bundle of server.ts -> dist/server.cjs
npm start            # production: NODE_ENV=production node dist/server.cjs (serves dist/)
npm run lint         # tsc --noEmit (type-check only; the project never emits JS via tsc)

npm test             # vitest run (unit + component + integration + API)
npm run test:watch   # vitest in watch mode
npm run test:cov     # vitest run --coverage (v8; covers src/** and app.ts)
npm run test:api     # only tests/api (Supertest against the Express app)
npm run e2e          # Playwright (boots the dev server automatically)
npm run e2e:smoke    # Playwright @smoke subset
```

Run a single Vitest file or test:
```bash
npx vitest run tests/unit/utils.csv.test.ts
npx vitest run -t "auto-detects a comma delimiter"
```

After changing `server.ts` you must restart `npm run dev` — `tsx` does not hot-reload the
server entry (Vite still hot-reloads the React frontend).

## Architecture

**Single-page React 19 app + thin Express backend, all data in the browser.** There is no
router and no database.

- **Central state lives in `src/App.tsx`.** Four state slices (`groepen`, `teams`, `studenten`,
  `assessments`) are loaded once on mount (with `INITIAL_*` seed-data fallback) and persisted to
  `localStorage` under the keys `promef_groepen`, `promef_teams`, `promef_studenten`,
  `promef_assessments`. Every mutation goes through an `updateAndSave*` helper that sets React
  state **and** writes localStorage. Views never touch localStorage directly — they receive data
  and callbacks as props from `App`.
- **Navigation is a `activeView` string** in `App` (`dashboard | results | students | data |
  assessment | feedback`), not URL routing. `assessment` and `feedback` are reached via row/card
  clicks, not header tabs.
- **`assessments` is keyed by `teamId`.** A `TeamAssessment` contains
  `studentAssessments[studentId]` = `{ scores, isDuo, notes }`. "Reset one student" means
  replacing that one entry; team status (`not_started | partial | completed`) is recomputed on
  every save from whether all students have all 6 criteria scored.
- **Domain model and rules are in `src/types.ts`.** The six fixed `CRITERIA` (each with
  `tagsByLevel`), the `LevelType`→score mapping (`Onder=1..Excellent=4`), and
  `getCijferFromScore` (points→grade) are the single source of truth. Pass/fail is computed in the
  views: fully scored AND no criterion equal to 1 (one "Onder" = gezakt, regardless of grade).
  The green calendar status means *completed*, not *passed*.
- **Pure helpers/seed-data are in `src/utils.ts`** (time-slot math, CSV parse with `;`/`,`
  auto-detect, CSV/JSON export, localStorage wrappers).

**Backend is split for testability:**
- `app.ts` — the Express `app` with the two API routes and a **injectable** Gemini client
  (`setGeminiClientForTesting` / `resetGeminiClientForTesting`). No `listen`.
- `server.ts` — imports `app`, adds Vite middleware (dev) or static `dist/` (prod), then listens.
- `POST /api/analyze-assessment` calls Gemini (structured output, schema sized to the actual
  number of students) and **gracefully falls back** to a fixed scenario (with name remapping) when
  `GEMINI_API_KEY` is absent. `POST /api/simulate-analysis` returns fixed legacy scenarios.

**The AI "simulation" is client-side, not the server.** `src/components/AiNotulistPanel.tsx`
builds the transcript + analysis locally via `buildSimulation(students, pattern)` from the real
team roster and a chosen score profile (`onvoldoende | random | uitstekend`); it does not call
`/api/simulate-analysis`. The server endpoint of that name only feeds the audio-analysis fallback.

## Testing conventions

- This existing app is being brought under test **phase by phase** following `BLUEPRINT.html`
  (F0 = harness + server split; F1 = domain/utils; later phases add the React views). Keep new
  tests within the current phase's scope.
- API tests (`tests/api/**`) start with `// @vitest-environment node` and exercise `app.ts`
  directly with Supertest, injecting a fake Gemini client (or `null` to hit the fallback).
- jsdom's `localStorage` is unreliable under Vitest — back it with an in-memory `Storage` stub
  (see `tests/unit/utils.storage.test.ts`) instead of relying on the environment.
- Vitest 4 removed `environmentMatchGlobs`; select the Node environment per-file with the
  docblock above, not via config globs.
- Each phase ends green (`npm test` + `tsc` + relevant e2e/smoke) and is committed before moving on.

## Environment

`GEMINI_API_KEY` (see `.env.example`) enables real Gemini analysis; without it the app and tests
use the built-in fallback. `.env*` is gitignored except `.env.example`.
