import React, { useState } from "react";
import { Groep, Team, Student, TeamAssessment, CRITERIA, getCijferFromScore } from "../types";
import { downloadCSV } from "../utils";
import { AlertTriangle, CheckCircle, Download, Eye, Tag, ArrowUpRight } from "lucide-react";

interface ResultsViewProps {
  groepen: Groep[];
  teams: Team[];
  studenten: Student[];
  assessments: Record<string, TeamAssessment>;
  onSelectStudentFeedback: (studentId: string) => void;
}

export default function ResultsView({
  groepen,
  teams,
  studenten,
  assessments,
  onSelectStudentFeedback
}: ResultsViewProps) {
  const [selectedGroepId, setSelectedGroepId] = useState<string>(groepen[0]?.id || "");

  const activeGroup = groepen.find(g => g.id === selectedGroepId);
  const activeStudents = studenten.filter(s => s.groepId === selectedGroepId);

  // Compile detailed evaluation for each student
  const studentResults = activeStudents.map((student) => {
    const team = teams.find(t => t.id === student.teamId);
    const assessment = team ? assessments[team.id] : undefined;
    const scores = assessment?.studentAssessments?.[student.id]?.scores || {};
    
    // Sum scores
    const critScores = CRITERIA.map(c => scores[c.id] || 0);
    const scoredCount = critScores.filter(s => s > 0).length;
    
    const totalPoints = critScores.reduce((sum, val) => sum + val, 0);
    const isFullyEvaluated = scoredCount === 6;
    
    // Checks if failed: failed if any scored criterion has a grade of 1 ("Onder niveau")
    const hasOnvoldoende = critScores.some(s => s === 1);
    const isPass = isFullyEvaluated && !hasOnvoldoende;
    const cijfer = isFullyEvaluated ? getCijferFromScore(totalPoints) : null;

    return {
      student,
      team,
      scores,
      critScores,
      totalPoints,
      isFullyEvaluated,
      hasOnvoldoende,
      isPass,
      cijfer
    };
  });

  const handleExportCSV = () => {
    if (!activeGroup) return;
    const headers = ["Student", "Groep", "Team Nummer", "C1 (Veranderen)", "C2 (Sociaal)", "C3 (Verbinden)", "C4 (Bijdrage)", "C5 (Intercultureel)", "C6 (Waarden)", "Totaal Punten", "Cijfer", "Status"];
    
    const rows = studentResults.map(r => {
      const statusStr = r.isFullyEvaluated 
        ? (r.isPass ? "GESLAAGD" : "GEZAKT (criteria onvoldoende)")
        : "DEELS INGEVULD";
        
      return [
        r.student.name,
        activeGroup.name,
        r.team ? `Team ${r.team.teamNummer}` : "N/A",
        ...CRITERIA.map(c => r.scores[c.id]?.toString() || "-"),
        r.isFullyEvaluated ? r.totalPoints.toString() : "-",
        r.cijfer !== null ? r.cijfer.toString() : "-",
        statusStr
      ];
    });

    downloadCSV(
      headers,
      rows,
      `PROMEF_Resultaten_${activeGroup.name}.csv`
    );
  };

  return (
    <div className="space-y-6" id="results-view-workspace">
      {/* Top filter section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <label htmlFor="group-select" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Selecteer Klas:</label>
          <select
            id="group-select"
            value={selectedGroepId}
            onChange={(e) => setSelectedGroepId(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
          >
            {groepen.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {activeGroup && (
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-755 bg-indigo-600 text-white font-extrabold text-[10px] rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
            id="csv-download-btn"
          >
            <Download size={12} />
            <span>Exporteer Beoordelingsstaat (CSV)</span>
          </button>
        )}
      </div>

      {activeGroup ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {/* Main compilation table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="results-data-table">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Team</th>
                  {CRITERIA.map(c => (
                    <th key={c.id} className="p-4 text-center cursor-help uppercase" title={c.title}>C{c.id}</th>
                  ))}
                  <th className="p-4 text-center">Totaal (PNT)</th>
                  <th className="p-4 text-center">Cijfer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Rapport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {studentResults.map(({ student, team, scores, totalPoints, isFullyEvaluated, hasOnvoldoende, isPass, cijfer }) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-extrabold text-slate-800 text-[13px]">{student.name}</td>
                    <td className="p-4 font-bold text-slate-400 font-mono text-[10px]">{team ? `TEAM ${team.teamNummer}` : "N/A"}</td>
                    
                    {/* C1 to C6 column cells */}
                    {CRITERIA.map((c) => {
                      const score = scores[c.id];
                      let color = "text-slate-400 font-normal";
                      let bg = "";
                      
                      if (score === 1) { color = "text-red-700 font-black"; bg = "bg-red-50/20"; }
                      if (score === 2) { color = "text-amber-700 font-bold"; bg = "bg-amber-50/10"; }
                      if (score === 3) { color = "text-emerald-700 font-bold"; bg = "bg-emerald-50/10"; }
                      if (score === 4) { color = "text-indigo-700 font-black"; bg = "bg-indigo-50/10"; }
 
                      return (
                        <td key={c.id} className={`p-4 text-center font-bold font-mono text-[11px] ${bg} ${color}`}>
                          {score || "-"}
                        </td>
                      );
                    })}
 
                    {/* Total points */}
                    <td className="p-4 text-center font-extrabold font-mono text-slate-700 bg-slate-50/50">
                      {isFullyEvaluated ? totalPoints : `${studentResults.filter(r => r.student.id === student.id)[0]?.critScores.filter(s => s > 0).length || 0}/6`}
                    </td>
 
                    {/* Final Grade convert Key */}
                    <td className="p-4 text-center">
                      {cijfer !== null ? (
                        <span className={`inline-block font-black text-xs px-2.5 py-1 rounded-lg font-mono ${cijfer >= 6.0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" : "bg-red-50 text-red-700 border border-red-100/50"}`}>
                          {cijfer}
                        </span>
                      ) : (
                        <span className="text-slate-450 italic font-medium scale-95">Deels</span>
                      )}
                    </td>
 
                    {/* Pass/Fail status flag */}
                    <td className="p-4">
                      {isFullyEvaluated ? (
                        isPass ? (
                          <span className="inline-flex items-center space-x-1.5 text-emerald-800 font-bold bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-extrabold">
                            <CheckCircle size={10} />
                            <span>Geslaagd</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-red-000 text-red-800 font-bold bg-red-50 border border-red-100/50 px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-extrabold" title="Zak/slaag-grens: alle criteria moeten minimaal Op Niveau (score 2) zijn.">
                            <AlertTriangle size={10} className="shrink-0 text-red-600" />
                            <span>Gezakt</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 italic font-medium">Onvolledig</span>
                      )}
                    </td>
 
                    {/* Action button feedback report */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => onSelectStudentFeedback(student.id)}
                        className="inline-flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl text-[10px] font-extrabold transition-all focus:outline-none cursor-pointer uppercase tracking-wider shadow-sm"
                        id={`view-feedback-btn-${student.id}`}
                      >
                        <Eye size={12} />
                        <span>Rapport</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
 
          {studentResults.length === 0 && (
            <div className="p-8 text-center text-slate-450 italic font-medium">
              Geen studenten gevonden in deze klas. Voeg ze toe of importeer ze in het Databeheer tabblad.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 italic font-medium">
          Selecteer of configureer ten minste één Groep om resultaten te ordenen.
        </div>
      )}
 
      {/* Criteria reference legend card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="results-legend">
        <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 space-y-2">
          <span className="text-[9px] font-extrabold text-indigo-850 bg-indigo-50 border border-indigo-150/40 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">Slaag/Zak Logica (Rubrics)</span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            Volgens de PROMEF exameneisen moeten <strong>alle 6 de beoordelingscriteria</strong> minimaal met <strong>"Op niveau" (score 2)</strong> zijn gemarkeerd. Een enkele "Onder niveau" (score 1) kwalificeert direct als onvoldoende / gezakt.
          </p>
        </div>
        <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 space-y-2">
          <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">Score Sleutel (Cijfers)</span>
          <p className="text-[11px] text-slate-500 font-mono leading-relaxed font-semibold">
            24 pnt = Cijfer 10 | 20 pnt = 9<br />
            16 pnt = 8 | 14-15 pnt = 7<br />
            12-13 pnt = 6 | 10-11 pnt = 5<br />
            05-09 pnt = 4
          </p>
        </div>
        <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 space-y-2">
          <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">Verklaring Criteria</span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            <strong>C1</strong>: Veranderen & evalueren<br />
            <strong>C2</strong>: Communiceren & adviseren<br />
            <strong>C3</strong>: Schakelen & Verbinden (NL)<br />
            <strong>C4</strong>: Bijdrage leveren (duo-werk)<br />
            <strong>C5</strong>: Intercultureel sensitief handelen<br />
            <strong>C6</strong>: Professionele waarden (OOA)
          </p>
        </div>
      </div>
    </div>
  );
}
