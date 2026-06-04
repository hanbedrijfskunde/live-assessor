import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CRITERIA, LevelType } from "../types";
import { GESPREKSSCRIPT } from "../gespreksscript";
import { X, Printer, MessageSquareQuote, Clock, Play, CheckSquare } from "lucide-react";

interface GespreksscriptModalProps {
  students: { id: string; name: string }[];
  klas: string;
  datum: string;
  teamNummer: string;
  assessoren: string[];
  onClose: () => void;
}

const LEVEL_TINT: Record<LevelType, { box: string; title: string }> = {
  Onder: { box: "border-red-100 bg-red-50/50", title: "text-red-700" },
  Op: { box: "border-amber-100 bg-amber-50/50", title: "text-amber-700" },
  Boven: { box: "border-emerald-100 bg-emerald-50/50", title: "text-emerald-700" },
  Excellent: { box: "border-indigo-100 bg-indigo-50/50", title: "text-indigo-700" },
};

export default function GespreksscriptModal({
  students,
  klas,
  datum,
  teamNummer,
  assessoren,
  onClose,
}: GespreksscriptModalProps) {
  // Esc to close + lock background scroll while the overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handlePrint = () => window.print();

  const overlay = (
    <div
      id="gespreksscript-overlay"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex justify-center p-4 sm:p-6"
      onMouseDown={(e) => {
        // Click on the dimmed backdrop (not the sheet) closes the modal.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gespreksscript-sheet"
        className="bg-white w-full max-w-[840px] h-fit my-4 rounded-2xl shadow-2xl border border-slate-200 p-7 sm:p-9 font-sans print:border-none print:shadow-none print:my-0 print:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-label="Gespreksscript voor assessoren"
      >
        {/* Action bar — not printed */}
        <div className="no-print flex items-center justify-between gap-3 mb-6">
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">
            <MessageSquareQuote size={13} />
            Gespreksscript assessoren
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="gespreksscript-print-btn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm focus:outline-none cursor-pointer"
            >
              <Printer size={14} />
              <span>Bewaar als PDF / Print</span>
            </button>
            <button
              onClick={onClose}
              id="gespreksscript-close-btn"
              aria-label="Sluiten"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable header */}
        <div className="border-b-4 border-slate-800 pb-5 flex flex-col sm:flex-row justify-between sm:items-start gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">
              HAN Bedrijfskunde
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 mt-3 tracking-tight">
              PROMEF Assessment — Gespreksscript
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Leidraad voor assessoren · zes criteria · opening, vragen per criterium en afronding
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-slate-500 space-y-1 shrink-0">
            <div><strong>Team:</strong> {teamNummer}</div>
            <div><strong>Klas:</strong> {klas}</div>
            <div><strong>Datum:</strong> {datum}</div>
            <div><strong>Assessoren:</strong> {assessoren.length ? assessoren.join(" & ") : "—"}</div>
            <div><strong>Kandidaten:</strong> {students.map((s) => s.name).join(" & ") || "—"}</div>
          </div>
        </div>

        {/* Timing */}
        <div className="mt-5 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
          <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <span>{GESPREKSSCRIPT.timing}</span>
        </div>

        {/* Opening */}
        <section className="mt-7">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <Play size={13} className="text-indigo-600 shrink-0" />
            <span>Opening</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {GESPREKSSCRIPT.opening.map((line, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                <span className="text-indigo-400 font-extrabold mt-0.5 select-none shrink-0">›</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Per-criterium script blocks */}
        <section className="mt-8 space-y-6">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            Vragen per criterium
          </h2>

          {GESPREKSSCRIPT.criteria.map((block) => {
            const crit = CRITERIA.find((c) => c.id === block.criteriumId);
            if (!crit) return null;
            return (
              <div
                key={block.criteriumId}
                className="border border-slate-200 rounded-2xl p-5 space-y-3.5 break-inside-avoid"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    {crit.id}. {crit.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed mt-0.5">{crit.description}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{block.toelichting}</p>
                </div>

                {/* Startvraag */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5">
                  <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest block mb-1">
                    Startvraag (voorlezen)
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">“{block.startvraag}”</p>
                </div>

                {/* Doorvragen — vragenbank */}
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Doorvragen (kies wat past)
                  </span>
                  <ul className="space-y-1.5">
                    {block.doorvragen.map((q, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-300 font-extrabold mt-0.5 select-none shrink-0">→</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signalen per niveau — afgeleid uit de rubric-tags */}
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Waar let je op (signalen per niveau)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["Onder", "Op", "Boven", "Excellent"] as LevelType[]).map((level) => (
                      <div key={level} className={`border rounded-xl p-2.5 ${LEVEL_TINT[level].box}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest block border-b border-black/5 pb-1 mb-1.5 ${LEVEL_TINT[level].title}`}>
                          {level}
                        </span>
                        <ul className="space-y-1">
                          {crit.tagsByLevel[level].map((tag) => (
                            <li key={tag} className="text-[9px] text-slate-600 leading-snug">{tag}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Afsluiting */}
        <section className="mt-8">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <CheckSquare size={13} className="text-emerald-600 shrink-0" />
            <span>Afronding</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {GESPREKSSCRIPT.afsluiting.map((line, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 font-extrabold mt-0.5 select-none shrink-0">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <div className="border-t border-dashed mt-10 pt-6 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-mono">
          <div>Beroepsopleiding Bedrijfskunde HAN</div>
          <div className="text-right">PROMEF · Gespreksleidraad</div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
