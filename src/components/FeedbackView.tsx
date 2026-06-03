import React, { useState } from "react";
import { Student, Groep, Team, TeamAssessment, CRITERIA, LEVEL_BADGES, LEVEL_SCORES, LevelType, getCijferFromScore } from "../types";
import { ArrowLeft, Printer, FileText, CheckCircle, Lightbulb, Check, ChevronRight } from "lucide-react";

interface FeedbackViewProps {
  groepen: Groep[];
  teams: Team[];
  studenten: Student[];
  assessments: Record<string, TeamAssessment>;
  initialStudentId?: string;
  onNavigateBack: () => void;
}

export default function FeedbackView({
  groepen,
  teams,
  studenten,
  assessments,
  initialStudentId,
  onNavigateBack
}: FeedbackViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || studenten[0]?.id || ""
  );

  const activeStudent = studenten.find(s => s.id === selectedStudentId);
  const activeGroup = activeStudent ? groepen.find(g => g.id === activeStudent.groepId) : undefined;
  const activeTeam = activeStudent ? teams.find(t => t.id === activeStudent.teamId) : undefined;
  const activeAssessment = activeTeam ? assessments[activeTeam.id] : undefined;

  // Derive scores & separate tags vs free text
  const getParsedDetails = (critId: number) => {
    const rawNotes = activeAssessment?.studentAssessments?.[selectedStudentId]?.notes?.[critId] || "";
    const scoreVal = activeAssessment?.studentAssessments?.[selectedStudentId]?.scores?.[critId];
    
    let level: LevelType | null = null;
    if (scoreVal === 1) level = "Onder";
    if (scoreVal === 2) level = "Op";
    if (scoreVal === 3) level = "Boven";
    if (scoreVal === 4) level = "Excellent";

    // Separate tag items (starting with ✓) from regular text
    const lines = rawNotes.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const checkedTags = lines.filter(l => l.startsWith("✓")).map(l => l.replace(/^✓\s*/, ""));
    const freeText = lines.filter(l => !l.startsWith("✓")).join("\n");

    return {
      level,
      scoreVal,
      checkedTags,
      freeText
    };
  };

  // Compile overall statistics for the student
  const totalScoreVal = activeStudent ? CRITERIA.reduce((sum, crit) => {
    const { scoreVal } = getParsedDetails(crit.id);
    return sum + (scoreVal || 0);
  }, 0) : 0;

  const fullyScored = activeStudent ? CRITERIA.every(crit => {
    const { scoreVal } = getParsedDetails(crit.id);
    return scoreVal !== undefined && scoreVal > 0;
  }) : false;

  const hasOnvoldoende = activeStudent ? CRITERIA.some(crit => {
    const { scoreVal } = getParsedDetails(crit.id);
    return scoreVal === 1;
  }) : false;

  const finalCijfer = fullyScored ? getCijferFromScore(totalScoreVal) : null;
  const isGeslaagd = fullyScored && !hasOnvoldoende;

  // Trigger browser print dialog (A4 css styling works perfectly)
  const handlePrint = () => {
    window.print();
  };

  // Compile Dynamic Strengths and Improvements from the notes text or fallback to defaults
  const getStrengthsAndActionPoints = () => {
    const parsed = CRITERIA.map(crit => ({
      crit,
      ...getParsedDetails(crit.id)
    }));

    // Gather Boven or Excellent remarks as strengths
    const strengths = parsed
      .filter(p => (p.level === "Boven" || p.level === "Excellent") && p.freeText)
      .map(p => `[${p.crit.title}] ${p.freeText}`);

    // Gather Onder remarks as areas of improvement
    const improvements = parsed
      .filter(p => (p.level === "Onder" || p.level === "Op") && p.freeText)
      .map(p => `[${p.crit.title}] ${p.freeText}`);

    // Fallbacks if notes are blank
    const fallbackStrengths = [
      "Actieve collegiale deelname aan het groepsgesprek.",
      "Bereidheid om theorie te verkennen en toe te passen in de simulatie."
    ];
    const fallbackImprovements = [
      "Zorg voor een scherpere theoretische onderbouwing vóór aanvang van het assessment.",
      "Oefen specifiek met het constructief reageren op onverwachte stakeholder-weerstand."
    ];

    return {
      strengths: strengths.length > 0 ? strengths : fallbackStrengths,
      improvements: improvements.length > 0 ? improvements : fallbackImprovements
    };
  };

  const { strengths, improvements } = getStrengthsAndActionPoints();

  return (
    <div className="space-y-6" id="feedback-report-wrapper">
      
      {/* Top action block web selection */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-xl p-4 gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={onNavigateBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
            id="back-btn"
          >
            <ArrowLeft size={18} />
          </button>
          
          <label htmlFor="student-report-select" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kies Student:</label>
          <select
            id="student-report-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          >
            {studenten.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({groepen.find(g => g.id === s.groepId)?.name || "Klas"})</option>
            ))}
          </select>
        </div>

        {activeStudent && (
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm focus:outline-none cursor-pointer"
            id="print-pdf-btn"
          >
            <Printer size={14} />
            <span>Exporteer naar PDF / Print</span>
          </button>
        )}
      </div>

      {activeStudent && activeGroup && activeTeam ? (
        <div className="max-w-[840px] mx-auto bg-white border border-slate-300 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.03)] overflow-hidden p-8 font-sans print:border-none print:shadow-none print:p-0" id="print-sheet-boundary">
          
          {/* Print Header */}
          <div className="border-b-4 border-slate-800 pb-5 flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-650 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">HAN Bedrijfskunde</span>
              <h1 className="text-2xl font-extrabold text-slate-850 mt-3 tracking-tight">PROMEF Assessment Feedbackrapport</h1>
              <p className="text-xs text-slate-500 mt-1">Academie Organisatie & Ontwikkeling | Midterm Assessment</p>
            </div>
            <div className="text-right font-mono text-xs text-slate-500 space-y-1">
              <div><strong>Kandidaat:</strong> {activeStudent.name}</div>
              <div><strong>Datum:</strong> {activeGroup.datum}</div>
              <div><strong>Klas:</strong> {activeGroup.name}</div>
              <div><strong>Assessoren:</strong> {activeGroup.assessoren.join(" & ")}</div>
            </div>
          </div>

          {/* Assessment Summary stats block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 bg-slate-50/50 p-4 border rounded-xl border-slate-200 items-center">
            <div className="text-center md:border-r border-slate-200 p-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Totaalscore Criteria</span>
              <span className="text-3xl font-black text-slate-800 font-mono mt-1 block">
                {fullyScored ? `${totalScoreVal} / 24` : "Onvolledig"}
              </span>
            </div>
            
            <div className="text-center md:border-r border-slate-200 p-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Definitief Cijfer</span>
              {finalCijfer !== null ? (
                <span className={`text-3xl font-black font-mono mt-1 block ${finalCijfer >= 6.0 ? "text-emerald-700" : "text-red-700"}`}>
                  {finalCijfer.toFixed(1)}
                </span>
              ) : (
                <span className="text-sm font-semibold text-slate-400 mt-3 block">Runde nog bezig</span>
              )}
            </div>

            <div className="text-center p-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Beoordelingsresultaat</span>
              {fullyScored ? (
                isGeslaagd ? (
                  <span className="text-sm font-extrabold text-white bg-emerald-600 border border-emerald-700 px-3 py-1 rounded mt-2 inline-block">
                    GESLAAGD
                  </span>
                ) : (
                  <span className="text-sm font-extrabold text-white bg-red-650 border border-red-700 px-3 py-1 rounded mt-2 inline-block">
                    GEZAKT (criteria-tekort)
                  </span>
                )
              ) : (
                <span className="text-sm font-semibold text-slate-400 mt-2 inline-block">Niet afgerond</span>
              )}
            </div>
          </div>

          {/* Rubrics breakdown table */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center space-x-1">
              <FileText size={14} className="text-indigo-600 shrink-0" />
              <span>Gespecificeerde criteria scorekaarten</span>
            </h3>

            <div className="space-y-4 divide-y divide-slate-100">
              {CRITERIA.map((crit) => {
                const { level, checkedTags, freeText } = getParsedDetails(crit.id);

                return (
                  <div key={crit.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{crit.id}. {crit.title}</h4>
                        <p className="text-[10px] text-slate-400 italic max-w-xl leading-relaxed">{crit.description}</p>
                      </div>
                      <span className={`text-[10px] shrink-0 inline-block text-right ${level ? LEVEL_BADGES[level] : "bg-slate-100 text-slate-400"}`}>
                        {level ? `${level} niveau` : "Geen score geplaatst"}
                      </span>
                    </div>

                    {/* Tags block */}
                    {checkedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {checkedTags.map(tag => (
                          <span key={tag} className="text-[9px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200/60 px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="text-emerald-600 font-extrabold">✓</span>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Free textual justification */}
                    {freeText && (
                      <p className="text-xs text-slate-650 bg-slate-55/40 p-3 rounded-lg border border-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {freeText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Strengths & Growth options suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-300">
            {/* Strengths */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center space-x-1">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span>Sterke punten (Succesindicatoren)</span>
              </h3>
              <ul className="space-y-2">
                {strengths.map((str, index) => (
                  <li key={index} className="text-xs text-slate-650 flex items-start space-x-2 leading-relaxed">
                    <span className="text-emerald-500 font-extrabold mt-0.5 select-none shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center space-x-1">
                <Lightbulb size={14} className="text-indigo-600 shrink-0" />
                <span>Belangrijke ontwikkelpunten (Suggesties)</span>
              </h3>
              <ul className="space-y-2">
                {improvements.map((imp, index) => (
                  <li key={index} className="text-xs text-slate-650 flex items-start space-x-2 leading-relaxed">
                    <span className="text-indigo-500 font-extrabold mt-0.5 select-none shrink-0">→</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signing footer */}
          <div className="border-t border-dashed mt-12 pt-8 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            <div>Beroepsopleiding Bedrijfskunde HAN</div>
            <div className="text-right">Beoordeeld door: ________________________</div>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 italic">
          Selecteer hierboven een student om het feedbackrapport te laden.
        </div>
      )}
    </div>
  );
}
