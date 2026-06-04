#!/usr/bin/env python3
"""
Neemt een geannoteerde demovideo op van de volledige live-assessor docent-workflow:

    1. Roster importeren (demo/demo.csv)
    2. Docent/assessor toevoegen aan groep BKN-F03
    3. Naar student Leon (solo-assessment)
    4. Audio uploaden (demo/assessment-leon.mp3)
    5. Gemini analyseert de audio (echte API)
    6. AI-scores toepassen op het beoordelingsformulier

Aanpak: Playwright (Python) neemt de browser native op. De annotaties worden als
DOM-overlay in de pagina geinjecteerd tijdens de opname, dus ze zitten gesynct in de
video zonder losse post-processing. Na afloop converteert ffmpeg de .webm naar .mp4.

Gebruik:
    python3 record_demo.py                # boot de dev-server zelf indien nodig
    SLOW_MO=600 STEP_PAUSE=3 python3 record_demo.py   # rustiger tempo

Vereist: een geldige GEMINI_API_KEY in <repo>/.env (de dev-server leest die via dotenv).
"""

import os
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

# ---------------------------------------------------------------------------
# Paden & configuratie
# ---------------------------------------------------------------------------
VIDEO_DIR = Path(__file__).resolve().parent           # demo/video
DEMO_DIR = VIDEO_DIR.parent                            # demo
PROJECT_ROOT = DEMO_DIR.parent                         # repo root
OUT_DIR = VIDEO_DIR / "out"

CSV_PATH = DEMO_DIR / "demo.csv"
MP3_PATH = DEMO_DIR / "assessment-leon.mp3"

BASE_URL = "http://localhost:3000"
GROEP = "BKN-F03"
STUDENT = "Leon"
DOCENT_NAAM = "Dr. M. Visser"

VIEWPORT = {"width": 1440, "height": 900}
SLOW_MO = int(os.environ.get("SLOW_MO", "450"))        # ms tussen Playwright-acties
STEP_PAUSE = float(os.environ.get("STEP_PAUSE", "2.6"))  # s leespauze per annotatie
TOTAL_STEPS = 6
GEMINI_TIMEOUT_MS = 180_000                            # echte Gemini kan even duren

# ---------------------------------------------------------------------------
# Annotatie-laag (in de pagina geinjecteerd)
# ---------------------------------------------------------------------------
INIT_SCRIPT = r"""
(() => {
  if (window.__demoReady) return;
  window.__demoReady = true;

  const ensure = () => {
    if (!document.getElementById('__demo_style')) {
      const style = document.createElement('style');
      style.id = '__demo_style';
      style.textContent = `
        #__demo_bar { position: fixed; left: 24px; right: 24px; bottom: 24px;
          z-index: 2147483647; background: rgba(15,23,42,0.95); color:#fff;
          border-radius:16px; padding:16px 22px; font-family: ui-sans-serif, system-ui, sans-serif;
          box-shadow: 0 16px 48px rgba(0,0,0,.40); display:flex; align-items:center; gap:18px;
          opacity:0; transform: translateY(14px); transition: opacity .35s ease, transform .35s ease;
          border: 1px solid rgba(255,255,255,.08); }
        #__demo_bar.visible { opacity:1; transform: translateY(0); }
        #__demo_step { flex-shrink:0; width:50px; height:50px; border-radius:13px;
          background: linear-gradient(135deg,#818cf8,#4f46e5); display:flex; align-items:center;
          justify-content:center; font-weight:800; font-size:20px; box-shadow:0 4px 14px rgba(79,70,229,.5); }
        #__demo_text { display:flex; flex-direction:column; gap:3px; min-width:0; }
        #__demo_title { font-weight:800; font-size:16px; letter-spacing:-.01em; }
        #__demo_body { font-size:13.5px; color:#cbd5e1; line-height:1.45; }
        #__demo_spot { position: fixed; z-index: 2147483646; border:3px solid #818cf8;
          border-radius:12px; box-shadow: 0 0 0 9999px rgba(15,23,42,0.38), 0 0 26px rgba(129,140,248,.9);
          pointer-events:none; opacity:0; transition: all .3s ease; }
        #__demo_spot.visible { opacity:1; }
      `;
      document.documentElement.appendChild(style);
    }
    if (!document.getElementById('__demo_bar') && document.body) {
      const bar = document.createElement('div');
      bar.id = '__demo_bar';
      bar.innerHTML = '<div id="__demo_step"></div>' +
        '<div id="__demo_text"><div id="__demo_title"></div><div id="__demo_body"></div></div>';
      document.body.appendChild(bar);
    }
    if (!document.getElementById('__demo_spot') && document.body) {
      const spot = document.createElement('div');
      spot.id = '__demo_spot';
      document.body.appendChild(spot);
    }
    return {
      bar: document.getElementById('__demo_bar'),
      spot: document.getElementById('__demo_spot'),
    };
  };

  window.__demoAnnotate = (step, total, title, body) => {
    const { bar } = ensure();
    if (!bar) return;
    document.getElementById('__demo_step').textContent = step;
    document.getElementById('__demo_title').textContent =
      total ? (title + '  ·  Stap ' + step + '/' + total) : title;
    document.getElementById('__demo_body').textContent = body || '';
    bar.classList.add('visible');
  };

  window.__demoSpotlight = (box) => {
    const { spot } = ensure();
    if (!spot) return;
    if (!box) { spot.classList.remove('visible'); return; }
    const pad = 8;
    spot.style.left = (box.x - pad) + 'px';
    spot.style.top = (box.y - pad) + 'px';
    spot.style.width = (box.width + pad * 2) + 'px';
    spot.style.height = (box.height + pad * 2) + 'px';
    spot.classList.add('visible');
  };
})();
"""


def log(msg: str) -> None:
    print(f"[demo] {msg}", flush=True)


# ---------------------------------------------------------------------------
# Dev-server helpers
# ---------------------------------------------------------------------------
def server_up() -> bool:
    try:
        with urllib.request.urlopen(BASE_URL, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


def start_server():
    """Start `npm run dev` in een eigen process-group als de server nog niet draait."""
    if server_up():
        log("Dev-server draait al op :3000 — wordt hergebruikt.")
        return None

    log("Dev-server starten (npm run dev) ...")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,  # eigen process-group -> netjes afsluitbaar
    )
    deadline = time.time() + 120
    while time.time() < deadline:
        if server_up():
            log("Dev-server is bereikbaar.")
            return proc
        if proc.poll() is not None:
            raise RuntimeError("Dev-server is onverwacht gestopt tijdens opstarten.")
        time.sleep(1)
    raise RuntimeError("Dev-server kwam niet binnen 120s online.")


def stop_server(proc) -> None:
    if proc is None:
        return
    log("Dev-server afsluiten ...")
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc.wait(timeout=10)
    except Exception:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Annotatie-/highlight-helpers (Python-zijde)
# ---------------------------------------------------------------------------
def annotate(page, step, title, body, pause=None, total=TOTAL_STEPS) -> None:
    page.evaluate(
        "([s,t,ti,b]) => window.__demoAnnotate(s,t,ti,b)",
        [str(step), total, title, body],
    )
    page.wait_for_timeout(int((pause if pause is not None else STEP_PAUSE) * 1000))


def highlight(page, locator, pause=0.9) -> None:
    try:
        locator.scroll_into_view_if_needed(timeout=4000)
        box = locator.bounding_box()
    except Exception:
        box = None
    if box:
        page.evaluate("(b) => window.__demoSpotlight(b)", box)
        page.wait_for_timeout(int(pause * 1000))


def clear_spotlight(page) -> None:
    page.evaluate("() => window.__demoSpotlight(null)")


# ---------------------------------------------------------------------------
# De workflow
# ---------------------------------------------------------------------------
def run_workflow(page) -> None:
    # Native dialogs (alerts bij CSV-import en bij toepassen) automatisch accepteren.
    page.on("dialog", lambda d: d.accept())
    page.set_default_timeout(30_000)

    log("App laden ...")
    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.get_by_role("button", name="Kalenderoverzicht")).to_be_visible()
    page.evaluate(INIT_SCRIPT)  # overlay zeker beschikbaar maken
    page.wait_for_timeout(800)

    annotate(page, "✨", "PROMEF Assessment Tool",
             "Een volledige beoordelingsworkflow: van studentenlijst tot AI-ondersteunde scores.",
             pause=3.0, total=None)

    # --- Stap 1: Roster importeren ----------------------------------------
    annotate(page, 1, "Roster importeren",
             "De docent importeert een CSV met studenten; groepen en teams worden automatisch ingedeeld.")
    page.get_by_role("button", name="Dataset & Import").click()
    page.wait_for_timeout(600)
    import_btn = page.get_by_role("button", name="Selecteer & Importeer CSV")
    highlight(page, import_btn)
    page.locator('input[type="file"][accept=".csv,.txt"]').set_input_files(str(CSV_PATH))
    page.wait_for_timeout(1400)  # alert wordt auto-geaccepteerd
    clear_spotlight(page)

    # --- Stap 2: Docent/assessor toevoegen --------------------------------
    annotate(page, 2, "Docent toevoegen",
             f"In het kalenderoverzicht koppelt de docent een assessor aan klas {GROEP}.")
    page.get_by_role("button", name="Kalenderoverzicht").click()
    page.wait_for_timeout(800)
    edit_btn = page.get_by_label(f"Bewerk assessoren voor {GROEP}")
    highlight(page, edit_btn)
    edit_btn.click()
    page.wait_for_timeout(500)
    naam_veld = page.get_by_placeholder("Docent toevoegen")
    highlight(page, naam_veld)
    naam_veld.fill(DOCENT_NAAM)
    page.wait_for_timeout(500)
    page.get_by_label("Voeg assessor toe").click()
    page.wait_for_timeout(700)
    page.get_by_label(f"Klaar met assessoren bewerken voor {GROEP}").click()
    page.wait_for_timeout(900)
    clear_spotlight(page)

    # --- Stap 3: Naar Leon ------------------------------------------------
    annotate(page, 3, f"Assessment van {STUDENT}",
             f"{STUDENT} doet een solo-assessment. De docent opent de teamkaart om te beoordelen.")
    leon_card = page.locator("[id^=team-card-]").filter(has_text=STUDENT).first
    highlight(page, leon_card, pause=1.2)
    leon_card.click()
    expect(page.locator("#back-to-cal-btn")).to_be_visible()
    page.wait_for_timeout(1000)
    clear_spotlight(page)

    # --- Stap 4: Audio uploaden -------------------------------------------
    annotate(page, 4, "Audio uploaden",
             "De docent uploadt de geluidsopname van het assessmentgesprek (MP3).")
    upload_label = page.get_by_text("Upload Audio")
    highlight(page, upload_label)
    page.locator('input[type="file"][accept="audio/*"]').set_input_files(str(MP3_PATH))
    page.wait_for_timeout(800)
    clear_spotlight(page)

    # --- Stap 5: AI verwerkt de audio -------------------------------------
    annotate(page, 5, "AI analyseert het gesprek",
             "Gemini transcribeert de opname en bepaalt per criterium het niveau met onderbouwing.",
             pause=2.0)
    log("Wachten op Gemini-resultaat (#ai-apply-card) ...")
    apply_card = page.locator("#ai-apply-card")
    expect(apply_card).to_be_visible(timeout=GEMINI_TIMEOUT_MS)
    log("Gemini-resultaat ontvangen.")
    apply_card.scroll_into_view_if_needed()
    page.wait_for_timeout(2200)

    # --- Stap 6: AI-scores toepassen --------------------------------------
    annotate(page, 6, "AI-scores toepassen",
             "Met een klik worden de gedetecteerde scores en feedback op het formulier ingevuld.")
    apply_btn = page.locator("#apply-ai-suggestions-btn")
    highlight(page, apply_btn, pause=1.2)
    apply_btn.click()
    page.wait_for_timeout(1600)  # alert auto-geaccepteerd; criteria C1-C6 vullen
    clear_spotlight(page)

    # Toon het ingevulde resultaat en sluit af.
    page.locator("#assessment-workspace").scroll_into_view_if_needed()
    annotate(page, "✓", "Beoordeling compleet",
             f"De scores voor {STUDENT} zijn ingevuld — de volledige workflow in enkele klikken.",
             pause=3.5, total=None)


def convert_to_mp4(webm_path: Path) -> Path:
    mp4_path = OUT_DIR / "live-assessor-demo.mp4"
    log(f"Converteren naar MP4: {mp4_path.name}")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(webm_path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-an",
            str(mp4_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return mp4_path


def main() -> int:
    for asset in (CSV_PATH, MP3_PATH):
        if not asset.exists():
            log(f"FOUT: vereist bestand ontbreekt: {asset}")
            return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    server_proc = start_server()
    webm_path = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, slow_mo=SLOW_MO)
            context = browser.new_context(
                viewport=VIEWPORT,
                record_video_dir=str(OUT_DIR),
                record_video_size=VIEWPORT,
            )
            context.add_init_script(INIT_SCRIPT)
            page = context.new_page()
            try:
                run_workflow(page)
            finally:
                webm_path = Path(page.video.path())
                page.wait_for_timeout(500)
                context.close()  # finaliseert de .webm
                browser.close()
        log(f"Ruwe opname: {webm_path}")
    finally:
        stop_server(server_proc)

    if webm_path and webm_path.exists():
        try:
            mp4 = convert_to_mp4(webm_path)
            log(f"KLAAR: {mp4}")
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            log(f"MP4-conversie overgeslagen ({e}). De .webm staat in {OUT_DIR}.")
    else:
        log("WAARSCHUWING: geen video-bestand gevonden.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
