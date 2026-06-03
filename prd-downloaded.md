# PRD: PROMEF Assessment Tool

## Context

Als sr. consultant/docent in het F-cluster (simulatie adviesbureau "The Giraffe Company") moet je op twee assessmentdagen (7 en 10 april) in totaal 10 duo-gesprekken voeren van 20+10 minuten. Tijdens die gesprekken moet je per student 6 criteria scoren, observaties vastleggen, en daarna gerichte feedback geven. Het probleem: je moet maximaal present zijn in het gesprek terwijl je tegelijk data vastlegt. Een papieren formulier is traag en moet achteraf overgetypt worden.

**Doel**: Een lokale browser-app (single HTML file) die de volledige assessmentcyclus ondersteunt: planning, dataverzameling, verwerking en terugkoppeling.

---

## Gegevens

### Datamodel
Groepen, teams en studenten zijn genormaliseerde entiteiten:
- **Groep**: naam, 1-2 assessoren (senior 1/2), datum (date picker), start-/eindtijd (time picker), slotduur (veelvouden van 15 min, default 30) en pauzes
- **Team**: teamnummer, gekoppeld aan een groep
- **Student**: naam, gekoppeld aan een groep en een team

Groepen, teams en studenten worden beheerd via de **Studenten**-view of via CSV-import. De app start standaard leeg; via **Databeheer** kan voorbeelddata worden geladen.

### 6 Beoordelingscriteria (elk 1-4 punten)
1. **Veranderen en evalueren** - demonstreert uitleg theoretisch concept uit veranderen/evalueren fase
2. **Sociaal communicatieve vaardigheden** - gespreksvaardigheden passend bij startende beroepsprofessional
3. **Schakelen en verbinden** - demonstreert omzetten weerstand in veranderbereidheid
4. **Professionaliseren (bijdrage)** - professionele bijdrage aan resultaat + groei als professional
5. **Professionaliseren (intercultureel)** - bespreekt intercultureel issue en aanpak
6. **Handelen vanuit waarden** - analyseert en lost morele kwestie op (OOA gedragsregels)

### Scoreniveaus
- Onder niveau (1), Op niveau (2), Boven niveau (3), Excellent (4)
- Alle criteria moeten minimaal "Op niveau" (2) zijn om te slagen
- Scoresleutel: 24=10, 20=9, 16=8, 14-15=7, 12-13=6, 10-11=5, 05-09=4

---

## Functionele eisen

### 1. Planning & Voorbereiding

#### Kalenderoverzicht (hoofdweergave dashboard)
- Dagweergave per assessmentdag (di 7 apr, vr 10 apr) naast elkaar als kolommen
- Verticale as: tijdslots dynamisch gegenereerd per groep op basis van start-/eindtijd en slotduur (configureerbaar per groep, default 30 min, veelvouden van 15 min)
- Elk team wordt als kaart/blok weergegeven in een tijdslot met: teamnummer, namen studenten, beoordelingsstatus (kleurindicatie)
- **Drag & drop**: teams kunnen versleept worden naar een ander tijdslot binnen dezelfde dag om de volgorde aan te passen. Volgorde wordt opgeslagen in localStorage.
- Klik op een teamblok om het assessment voor dat team te openen
- Lege tijdslots zijn klikbaar om een pauze toe te voegen (hover toont "+ pauze")
- Pauze-slots worden getoond als oranje cellen met "Pauze" label en ✕ knop om te verwijderen
- Nieuwe groepen krijgen een default pauze om 12:00; bestaande groepen worden niet verstoord
- Tijdslots buiten het bereik van een groep worden als disabled (gearceerd) getoond
- Visuele indicatie per teamblok:
  - Grijs: nog niet beoordeeld
  - Oranje: deels beoordeeld
  - Groen: volledig beoordeeld
- Onder de kalender: assessoren per dag en totaalvoortgang

#### Beheer (Studenten-view)
- Groepen toevoegen/bewerken/verwijderen met naam, assessoren, datum en tijden
- Teams toevoegen/verwijderen per groep (bulk: meerdere teams tegelijk aanmaken)
- Studenten toevoegen/bewerken/verwijderen met koppeling aan groep en team via dropdowns
- Cascade-verwijdering: groep verwijderen wist ook teams en studenten met data

#### Import & databeheer
- CSV-import voor deelnemersdata (herbruikbaar voor volgende cohorten) — parset automatisch groepen en teams uit CSV. Ondersteunt zowel komma als puntkomma als scheidingsteken (auto-detectie voor Nederlands Excel)
- Automatische verdeling van teams over tijdslots bij import (pauze-slots worden overgeslagen)
- Voorbeelddata laden (3 demoteams) om de app uit te proberen
- Volledige reset: wist alle data uit localStorage

### 2. Dataverzameling tijdens assessment
**Dit is de kritieke fase - UX moet geoptimaliseerd zijn voor minimale afleiding.**
**Primair apparaat: laptop (muis/trackpad). Touch is geen vereiste.**

#### Per team-gesprek:
- **Header**: teamnummer, namen van beide studenten
- **Duo- vs. individuele scoring**: per criterium een toggle om aan te geven of de score voor het hele duo geldt of per student apart. Default: individueel, maar criteria 4 (professionele bijdrage) kan typisch als duo-score.
- **Per student (of duo), per criterium**:
  - 4 grote klik-knoppen: Onder / Op / Boven / Excellent (kleurgecodeerd)
  - Klik om te scoren, klik opnieuw om te wijzigen
  - Observatie-chips: voorgedefinieerde tags die je kunt klikken (geen typen nodig)
  - Optioneel: inklapbaar vrij tekstveld voor uitzonderlijke observaties

#### Observatie-tags per criterium en niveau:
Tags zijn gegroepeerd per scoreniveau (Onder/Op/Boven/Excellent) met bijbehorende kleurcodes. Per criterium zijn er 3-4 tags per niveau.

**Interactie (drag-to-notes)**:
- Tags staan als kleurgecodeerde chips boven de notitievelden
- **Klik** op tag → picker popup met studentnamen → tag wordt in het notitieveld van die student geplaatst als `✓ tag-tekst`
- **Sleep** tag naar notitieveld → tag wordt ingevoegd
- Gebruikte tags tonen initiaal-badges van toegewezen student(en); badges blijven zichtbaar als er tekst voor of achter de tag wordt getypt
- Tags worden opgeslagen als `✓ tagText` markers in notities (geen apart tag-state). Matching via `includes` — markers kunnen overal in de tekst staan
- Toggle-off (tag verwijderen) wist alleen de marker, omliggende tekst blijft behouden

#### Notitievelden:
- Per student per criterium een auto-groeiend tekstveld
- Vrije tekst en tag-regels (✓ prefix) worden gecombineerd
- In de feedback-view worden tags en vrije tekst apart getoond
- Alles auto-saved naar localStorage

### 3. Verwerking (na afloop)
- Automatische berekening totaalscore per student
- Automatische omzetting naar cijfer via scoresleutel
- Vlaggen van studenten met "Onder niveau" op een of meer criteria (= onvoldoende)
- Overzicht per groep (BKN-F01 / BKN-F02)
- Vergelijking tussen teams

### 4. Presentatie & Terugkoppeling
- **Per student**: feedbackrapport met scores, observaties, sterke punten, ontwikkelpunten
- **Export opties**:
  - PDF per student (feedbackrapport)
  - CSV totaaloverzicht (voor administratie)
  - JSON backup (voor hergebruik/archivering)
- **Dashboard**: visueel overzicht scores per criterium, gemiddelden, verdeling

---

## Niet-functionele eisen

- **Single HTML file**: geen server, geen dependencies, geen build step
- **Offline**: werkt volledig zonder internet (na eerste keer openen)
- **localStorage**: alle data persistent opgeslagen in browser
- **Responsive**: geoptimaliseerd voor laptop, bruikbaar op tablet en mobiel. Media queries op 768px (tablet) en 480px (phone). Hamburger-menu navigatie op ≤768px. Kalender stapelt groepen verticaal op mobiel. Modals als bottom-sheet op kleine schermen. Tabellen horizontaal scrollbaar.
- **Klik-first**: grote knoppen (min 44px via `--touch-min`), duidelijke hover/focus states, keyboard shortcuts voor power-users
- **Snel**: pagina laadt instant, geen loading states
- **Donkere/lichte modus**: om schermafleiding te minimaliseren
- **Geen spraak-API nodig**: invoer via klikken en optioneel tekstveld

---

## Technische aanpak

- Single `index.html` met inline `<style>` en `<script>`
- Vanilla JS (geen frameworks) voor snelheid en eenvoud
- CSS Grid/Flexbox voor responsive layout
- localStorage API voor persistentie
- Geen externe API's nodig
- Blob API + download voor exports (CSV, JSON)
- Print CSS voor PDF-export (Ctrl+P / Cmd+P)
- FileReader API voor CSV-import

---

## Schermen / Views

1. **Overzicht** (Dashboard) - kalenderoverzicht per assessmentdag, teams, voortgang
2. **Assessment** - de kernview tijdens gesprekken (minimal UI)
3. **Resultaten** - overzicht scores, cijfers, vlaggen
4. **Feedback** - per-student rapport genereren/bekijken
5. **Studenten** - beheer van groepen, teams en studenten (toevoegen, bewerken, verwijderen)
6. **Databeheer** - CSV/JSON export, JSON backup/restore, voorbeelddata laden, volledige reset
7. **Handleiding** - ingebouwde stapsgewijze gebruikershandleiding (voorbereiding, assessment, afwikkeling) gericht op weinig digivaardige collega's, inclusief Excel/CSV instructies en privacy-richtlijnen

---

## Verificatie / Testen

1. Open `index.html` in browser (start leeg, of laad voorbeelddata via Databeheer)
2. Maak een groep aan met assessoren, datum en tijden
3. Voeg teams toe (bulk mogelijk) en studenten per team
4. Controleer of het kalenderoverzicht correct wordt getoond
5. Klik op een team en score alle 6 criteria voor beide studenten
6. Test observatie-tags: klik op een tag, wijs toe aan student, verifieer badge op chip
7. Test drag-to-notes: sleep een tag naar het notitieveld
8. Controleer automatische cijferberekening en zak/slaag logica
9. Ga naar Feedback, selecteer een student, en controleer het rapport (tags en vrije tekst apart)
10. Exporteer CSV en controleer correctheid
11. Test JSON backup, volledige reset, en JSON restore
12. Sluit browser, heropen - check of data bewaard is gebleven (localStorage)
13. Test duo-score toggle: stel een criterium in als duo-score en check dat beide studenten dezelfde score krijgen
14. Test CSV-import: importeer een bestand en verifieer dat groepen, teams en datum/tijden correct worden aangemaakt
