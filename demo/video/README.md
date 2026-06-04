# Demovideo-opname (Python + Playwright)

Neemt een geannoteerde screencast op van de volledige docent-workflow van de
live-assessor app:

1. **Roster importeren** — `demo/demo.csv` via het CSV-importveld
2. **Docent toevoegen** — een assessor koppelen aan klas `BKN-F03`
3. **Naar Leon** — de teamkaart van het solo-assessment openen
4. **Audio uploaden** — `demo/assessment-leon.mp3`
5. **AI-analyse** — de **echte** Gemini API transcribeert en scoort het gesprek
6. **Scores toepassen** — de AI-suggesties op het beoordelingsformulier zetten

De annotaties worden als overlay in de pagina geïnjecteerd tijdens de opname,
dus ze zitten gesynct in de video — geen losse montagestap nodig.

## Vereisten

- Node-dependencies van de app geïnstalleerd (`npm install` in de repo-root).
- Een geldige `GEMINI_API_KEY` in `<repo>/.env` (de dev-server leest die via
  `dotenv`). Zonder geldige key valt de app terug op een vast scenario in plaats
  van een echte audio-analyse.
- `ffmpeg` op het `PATH` (voor de `.webm` → `.mp4` conversie). Zonder ffmpeg
  blijft de `.webm` bewaard.

## Eenmalige setup

```bash
cd demo/video
pip install -r requirements.txt
playwright install chromium
```

## Opnemen

```bash
cd demo/video
python3 record_demo.py
```

Het script start zelf `npm run dev` op poort 3000 als die nog niet draait, en
sluit die daarna weer af. Draait er al een dev-server, dan wordt die hergebruikt.

Resultaat: `demo/video/out/live-assessor-demo.mp4` (plus de ruwe `.webm`).

## Tempo bijstellen

| Variabele | Standaard | Effect |
|-----------|-----------|--------|
| `SLOW_MO` | `450` | ms vertraging tussen elke Playwright-actie |
| `STEP_PAUSE` | `2.6` | seconden leespauze per annotatie-balk |

```bash
SLOW_MO=650 STEP_PAUSE=3.2 python3 record_demo.py   # rustiger
```

## Opmerkingen

- Stap 5 gebruikt de **echte** Gemini API; de uitkomst (en dus de ingevulde
  scores) varieert per run en de wachttijd hangt af van de API (timeout: 180 s).
- De ingebouwde knop *"Laad Voorbeeldset"* laadt `public/demo.csv` — dáár staat
  Leon **niet** in. Het script importeert daarom bewust `demo/demo.csv`.
- De CSV-import **vervangt** alle bestaande data in de browser (localStorage).
- De selectors volgen de bestaande JS e2e-tests (`e2e/*.spec.ts`); wijzigt de UI,
  pas dan de selectors in `record_demo.py` aan.
