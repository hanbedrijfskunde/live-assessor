# Assessoren bewerken bij bestaande groepen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Docenten kunnen de assessoren van een bestaande groep toevoegen/verwijderen, zowel vanuit de groepkaart in StudentManager als vanuit de klikbare badge in de kalenderheader.

**Architecture:** Unidirectionele dataflow. `App` krijgt één generieke `handleUpdateGroep(groepId, patch)` die via `updateAndSaveGroepen` muteert + persisteert. Eén herbruikbaar, controlled `AssessorenEditor`-component bevat de bewerk-interactie en wordt in beide views gebruikt. Views muteren nooit zelf localStorage.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react + userEvent, Tailwind, lucide-react.

---

## File Structure

- **Create** `src/components/AssessorenEditor.tsx` — controlled component: chips + invoerveld; verantwoordelijk voor toevoegen/verwijderen/valideren van namen. Eén verantwoordelijkheid, los testbaar.
- **Create** `tests/component/AssessorenEditor.test.tsx` — unit/component-tests voor de editor.
- **Modify** `src/App.tsx` — `handleUpdateGroep` toevoegen + als `onUpdateGroep` doorgeven aan `StudentManager` en `CalendarOverview`.
- **Modify** `src/components/StudentManager.tsx` — `onUpdateGroep`-prop; `AssessorenEditor` in de groepkaart.
- **Modify** `src/components/CalendarOverview.tsx` — `onUpdateGroep`-prop; klikbare badge + `editingGroepId`-state + `AssessorenEditor`.
- **Modify** `tests/component/StudentManager.test.tsx` — `onUpdateGroep` in props-stub + nieuwe tests.
- **Modify** `tests/component/CalendarOverview.test.tsx` — `onUpdateGroep` in props-stub + nieuwe tests.
- **Modify** `BLUEPRINT.html` + `CHANGELOG.md` — documentatie/versiebump.

---

## Task 1: AssessorenEditor component (TDD)

**Files:**
- Create: `src/components/AssessorenEditor.tsx`
- Test: `tests/component/AssessorenEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/component/AssessorenEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssessorenEditor from "../../src/components/AssessorenEditor";

describe("AssessorenEditor", () => {
  it("shows existing assessoren as chips", () => {
    render(<AssessorenEditor assessoren={["Anya", "Bram"]} onChange={vi.fn()} />);
    expect(screen.getByText("Anya")).toBeInTheDocument();
    expect(screen.getByText("Bram")).toBeInTheDocument();
  });

  it("shows a placeholder when empty", () => {
    render(<AssessorenEditor assessoren={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Nog geen assessoren")).toBeInTheDocument();
  });

  it("adds a trimmed name via the + button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya"]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "  Bram  ");
    await user.click(screen.getByRole("button", { name: "Voeg assessor toe" }));
    expect(onChange).toHaveBeenCalledWith(["Anya", "Bram"]);
  });

  it("adds a name via Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "Anya{Enter}");
    expect(onChange).toHaveBeenCalledWith(["Anya"]);
  });

  it("ignores empty/whitespace input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "   {Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a case-insensitive duplicate", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya"]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "anya{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes an assessor via its ✕ button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssessorenEditor assessoren={["Anya", "Bram"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Verwijder Anya" }));
    expect(onChange).toHaveBeenCalledWith(["Bram"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/component/AssessorenEditor.test.tsx`
Expected: FAIL — `Cannot find module '../../src/components/AssessorenEditor'`.

- [ ] **Step 3: Write the component**

Create `src/components/AssessorenEditor.tsx`:

```tsx
import React, { useState } from "react";
import { Plus } from "lucide-react";

interface AssessorenEditorProps {
  assessoren: string[];
  onChange: (next: string[]) => void;
}

export default function AssessorenEditor({ assessoren, onChange }: AssessorenEditorProps) {
  const [draft, setDraft] = useState("");

  const addAssessor = () => {
    const name = draft.trim();
    if (!name) return;
    const exists = assessoren.some(a => a.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...assessoren, name]);
    setDraft("");
  };

  const removeAssessor = (name: string) => {
    onChange(assessoren.filter(a => a !== name));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assessoren.length === 0 && (
        <span className="text-[10px] text-slate-400 italic">Nog geen assessoren</span>
      )}
      {assessoren.map(name => (
        <span
          key={name}
          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        >
          <span>{name}</span>
          <button
            type="button"
            onClick={() => removeAssessor(name)}
            className="text-indigo-400 hover:text-red-600 font-bold leading-none"
            aria-label={`Verwijder ${name}`}
            title={`Verwijder ${name}`}
          >
            ✕
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAssessor();
            }
          }}
          placeholder="Docent toevoegen"
          className="px-2 py-0.5 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-[11px] w-32"
        />
        <button
          type="button"
          onClick={addAssessor}
          className="text-indigo-600 hover:text-indigo-800"
          aria-label="Voeg assessor toe"
          title="Voeg assessor toe"
        >
          <Plus size={14} />
        </button>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/component/AssessorenEditor.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/AssessorenEditor.tsx tests/component/AssessorenEditor.test.tsx
git commit -m "feat(assessoren): herbruikbare AssessorenEditor met chips + add/remove

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: handleUpdateGroep + assessoren bewerken in StudentManager (TDD)

> **Waarom App + StudentManager in één taak/commit:** `onUpdateGroep` wordt een *verplichte*
> prop op `StudentManager`. Zodra de prop-interface die eist, moet `App.tsx` hem meteen
> doorgeven, anders compileert de commit niet. Daarom zitten de App-handler, de App→StudentManager-
> wiring en de StudentManager-wijziging in dezelfde commit. `App.tsx` raakt `CalendarOverview`
> hier nog niet aan, dus deze commit compileert volledig.

**Files:**
- Modify: `src/App.tsx` (handler ná `handleAddGroep` rond regel 74; prop bij `StudentManager`-render rond regel 388-398 — `CalendarOverview` nog NIET aanraken)
- Modify: `src/components/StudentManager.tsx` (props-interface rond regel 6-16; props-destructuring rond regel 18-28; groepkaart-header rond regel 316-334)
- Modify: `tests/component/StudentManager.test.tsx` (props-stub rond regel 20-31)

- [ ] **Step 0: Add the App handler + wire StudentManager**

In `src/App.tsx`, direct ná `handleAddGroep` (rond regel 74):

```tsx
const handleUpdateGroep = (groepId: string, patch: Partial<Groep>) => {
  const updated = groepen.map(g => (g.id === groepId ? { ...g, ...patch } : g));
  updateAndSaveGroepen(updated);
};
```

En in de `StudentManager`-render (rond regel 388-398), ná `onDeleteStudent`:

```tsx
            onDeleteStudent={handleDeleteStudent}
            onUpdateGroep={handleUpdateGroep}
```

(Raak `CalendarOverview` in `App.tsx` nu nog NIET aan — dat gebeurt in Task 3.)

- [ ] **Step 1: Add onUpdateGroep to the test's props stub and write failing tests**

In `tests/component/StudentManager.test.tsx`, voeg in `renderManager`'s `props` (na `onDeleteStudent: vi.fn(),`) toe:

```tsx
    onUpdateGroep: vi.fn(),
```

Voeg onderaan het bestand een nieuw describe-blok toe:

```tsx
describe("StudentManager — assessoren bewerken", () => {
  it("toont bestaande assessoren als chips in de groepkaart", () => {
    renderManager({ groepen: [{ ...group, assessoren: ["Anya", "Bram"] }] });
    expect(screen.getByText("Anya")).toBeInTheDocument();
    expect(screen.getByText("Bram")).toBeInTheDocument();
  });

  it("voegt een assessor toe via de groepkaart", async () => {
    const user = userEvent.setup();
    const props = renderManager({ groepen: [{ ...group, assessoren: ["Anya"] }] });
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "Bram{Enter}");
    expect(props.onUpdateGroep).toHaveBeenCalledWith("g1", { assessoren: ["Anya", "Bram"] });
  });

  it("verwijdert een assessor via de groepkaart", async () => {
    const user = userEvent.setup();
    const props = renderManager({ groepen: [{ ...group, assessoren: ["Anya", "Bram"] }] });
    await user.click(screen.getByRole("button", { name: "Verwijder Anya" }));
    expect(props.onUpdateGroep).toHaveBeenCalledWith("g1", { assessoren: ["Bram"] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/component/StudentManager.test.tsx`
Expected: FAIL — geen "Docent toevoegen"-veld / geen chips gerenderd.

- [ ] **Step 3: Wire the prop into StudentManager**

In `src/components/StudentManager.tsx`:

a) Importeer het component en het `Groep`-type is al geïmporteerd. Voeg de import toe onder de bestaande imports (regel 4):

```tsx
import AssessorenEditor from "./AssessorenEditor";
```

b) Breid de props-interface uit (na `onDeleteStudent: (studentId: string) => void;`, regel 15):

```tsx
  onUpdateGroep: (groepId: string, patch: Partial<Groep>) => void;
```

c) Voeg `onUpdateGroep` toe aan de destructuring (na `onDeleteStudent`, regel 27):

```tsx
  onDeleteStudent,
  onUpdateGroep
```

- [ ] **Step 4: Render the editor in the group card**

In de groepkaart-header, ná het sluitende `</div>` van de header-flexrow met de verwijderknop (de `<div className="flex justify-between items-center border-b ...">` die op regel 316 begint en op regel 334 sluit), voeg een nieuwe assessoren-regel toe vóór het `{/* Team List with Students */}`-commentaar (regel 336):

```tsx
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Assessoren:</span>
                    <AssessorenEditor
                      assessoren={groep.assessoren}
                      onChange={(next) => onUpdateGroep(groep.id, { assessoren: next })}
                    />
                  </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/component/StudentManager.test.tsx`
Expected: PASS (alle bestaande + 3 nieuwe).

- [ ] **Step 6: Commit (App-handler + StudentManager samen — compileert volledig)**

```bash
git add src/App.tsx src/components/StudentManager.tsx tests/component/StudentManager.test.tsx
git commit -m "feat(assessoren): handleUpdateGroep + bewerk assessoren in StudentManager-groepkaart

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Klikbare assessoren-badge in CalendarOverview (TDD)

> Bevat ook de App→CalendarOverview-wiring (zelfde reden als Task 2: verplichte prop ⇒ App moet
> hem in dezelfde commit doorgeven). `handleUpdateGroep` bestaat al sinds Task 2.

**Files:**
- Modify: `src/App.tsx` (prop bij `CalendarOverview`-render rond regel 336-345)
- Modify: `src/components/CalendarOverview.tsx` (props-interface; component-state; groepheader-badge rond regel 138-142)
- Modify: `tests/component/CalendarOverview.test.tsx` (props-stub rond regel 19-29)

- [ ] **Step 1: Add onUpdateGroep to the test's props stub and write failing tests**

In `tests/component/CalendarOverview.test.tsx`, voeg in `renderCal`'s `props` (na `onNavigateToStudents: vi.fn(),`) toe:

```tsx
    onUpdateGroep: vi.fn(),
```

Voeg een nieuw describe-blok toe:

```tsx
describe("CalendarOverview — assessoren bewerken", () => {
  it("toont assessoren als badge die je kunt openen om te bewerken", async () => {
    const user = userEvent.setup();
    renderCal({ groepen: [g({ assessoren: ["Anya"] })] });
    // Badge zichtbaar, editor nog niet
    expect(screen.queryByPlaceholderText("Docent toevoegen")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bewerk assessoren" }));
    expect(screen.getByPlaceholderText("Docent toevoegen")).toBeInTheDocument();
  });

  it("voegt een assessor toe vanuit de kalenderheader", async () => {
    const user = userEvent.setup();
    const { props } = renderCal({ groepen: [g({ assessoren: ["Anya"] })] });
    await user.click(screen.getByRole("button", { name: "Bewerk assessoren" }));
    await user.type(screen.getByPlaceholderText("Docent toevoegen"), "Bram{Enter}");
    expect(props.onUpdateGroep).toHaveBeenCalledWith("g1", { assessoren: ["Anya", "Bram"] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/component/CalendarOverview.test.tsx`
Expected: FAIL — geen knop "Bewerk assessoren".

- [ ] **Step 3: Add prop, import, and editing state**

In `src/components/CalendarOverview.tsx`:

a) Voeg de import toe bij de andere component-imports bovenaan:

```tsx
import AssessorenEditor from "./AssessorenEditor";
```

b) Voeg `useState` toe aan de React-import als die er nog niet is, en breid de props-interface uit met:

```tsx
  onUpdateGroep: (groepId: string, patch: Partial<Groep>) => void;
```

(zorg dat `Groep` en `Partial` beschikbaar zijn — `Groep` wordt al geïmporteerd uit `../types`.)

c) Voeg `onUpdateGroep` toe aan de gedestructureerde props van de component.

d) Voeg viewniveau-state toe in de component-body (bij de andere `useState`-hooks):

```tsx
  const [editingGroepId, setEditingGroepId] = useState<string | null>(null);
```

e) Wire de prop in `src/App.tsx` in de `CalendarOverview`-render (rond regel 336-345), ná `onNavigateToStudents`:

```tsx
            onNavigateToStudents={() => setActiveView("students")}
            onUpdateGroep={handleUpdateGroep}
```

- [ ] **Step 4: Replace the read-only badge with a clickable badge + editor**

Vervang het bestaande badge-blok (regel 138-142):

```tsx
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-wider">
                    Assessoren: {groep.assessoren.join(" & ")}
                  </span>
                </div>
```

door:

```tsx
                <div className="text-left sm:text-right">
                  {editingGroepId === groep.id ? (
                    <div className="flex items-center gap-2 justify-start sm:justify-end">
                      <AssessorenEditor
                        assessoren={groep.assessoren}
                        onChange={(next) => onUpdateGroep(groep.id, { assessoren: next })}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingGroepId(null)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                      >
                        Klaar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingGroepId(groep.id)}
                      aria-label="Bewerk assessoren"
                      title="Klik om assessoren te bewerken"
                      className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-wider cursor-pointer"
                    >
                      Assessoren: {groep.assessoren.length > 0 ? groep.assessoren.join(" & ") : "—"}
                    </button>
                  )}
                </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/component/CalendarOverview.test.tsx`
Expected: PASS (alle bestaande + 2 nieuwe).

- [ ] **Step 6: Full type-check + suite**

Run: `npm run lint && npm test`
Expected: PASS, geen type-fouten.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/CalendarOverview.tsx tests/component/CalendarOverview.test.tsx
git commit -m "feat(assessoren): bewerk assessoren via klikbare badge in kalenderheader

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Blueprint + changelog bijwerken

**Files:**
- Modify: `BLUEPRINT.html`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Bepaal de nieuwe versie**

Lees de bovenste entry van `CHANGELOG.md` en de `v…`-tag in de `BLUEPRINT.html`-header. De huidige versie is `v1.11` (laatste commit). Nieuwe versie: `v1.12`.

- [ ] **Step 2: Werk BLUEPRINT.html bij**

Maak de volgende wijzigingen (beide diagram-registers — bron én gerenderd — en de proza consistent houden):

1. Componentenlijst (rond regel 292): voeg `AssessorenEditor.tsx` toe onder de components.
2. App-diagram (beide Mermaid-blokken rond regel 240 en 253): voeg een arrow `App --> AE["AssessorenEditor"]` of neem het op onder StudentManager/CalendarOverview zoals passend bij de bestaande stijl.
3. StudentManager-sectie (rond regel 539-541): vermeld dat de groepkaart de assessoren toont én inline laat bewerken via `onUpdateGroep`.
4. CalendarOverview-sectie: vermeld dat de assessoren-badge klikbaar is en via `AssessorenEditor` + `onUpdateGroep` bewerkt wordt (verwijder de impliciete "alleen read-only"-framing).
5. F3- en F4-fasekaarten (rond regel 873-884): voeg de gerealiseerde bewerk-functionaliteit toe.
6. Update de `v…`-tag in de header naar `v1.12`.

- [ ] **Step 3: Voeg CHANGELOG.md-entry toe (nieuwste bovenaan)**

```markdown
## v1.12 — Assessoren bewerkbaar bij bestaande groepen

### Verbeteringen
- Assessoren kunnen nu worden toegevoegd/verwijderd bij een bestaande groep, niet langer
  alleen bij het aanmaken. Nieuw herbruikbaar `AssessorenEditor`-component (chips + invoerveld)
  wordt op twee plekken gebruikt: de groepkaart in StudentManager en de klikbare badge in de
  kalenderheader. Eén generieke `App.handleUpdateGroep(groepId, patch)` voedt beide via de
  bestaande unidirectionele dataflow.

### Lessen
- De assessoren-badge stond al in de kalenderheader maar was read-only; gebruikers verwachtten
  hem ook te kunnen bewerken op de plek waar ze hem zien. Bewerk-affordances horen waar de data
  getoond wordt, niet alleen in een apart formulier.
- Door de bewerk-interactie in één controlled component te isoleren bleven beide views triviaal
  en identiek in gedrag — geen gedupliceerde validatie/dedup-logica.
```

- [ ] **Step 4: Commit**

```bash
git add BLUEPRINT.html CHANGELOG.md
git commit -m "docs(assessoren): blueprint + changelog v1.12 (assessoren bewerkbaar)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: E2E-smoke verifiëren (optioneel maar aanbevolen)

**Files:** geen wijziging; alleen draaien.

- [ ] **Step 1: Smoke-suite draaien**

Run: `npm run e2e:smoke`
Expected: PASS — de bestaande journeys breken niet door de nieuwe assessoren-regel in de groepkaart en de gewijzigde kalender-badge.

> Als een bestaande Playwright-selector op de oude statische badge-tekst mikte, pas die aan naar de nieuwe knop (`Bewerk assessoren` / badge-tekst met `—`-fallback). Geen nieuwe e2e nodig voor deze iteratie; component-tests dekken de logica.
