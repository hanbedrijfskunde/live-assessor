import React, { useState, useRef } from "react";
import { Groep, Team, Student, CRITERIA, LevelType, LEVEL_SCORES, LEVEL_COLORS, LEVEL_BADGES, TeamAssessment, StudentAssessment } from "../types";
import { ArrowLeft, User, HelpCircle, AlertTriangle, Sparkles, Check, ChevronRight, RotateCcw, ScrollText } from "lucide-react";
import AiNotulistPanel from "./AiNotulistPanel";
import GespreksscriptModal from "./GespreksscriptModal";

interface AssessmentViewProps {
  team: Team;
  groep: Groep;
  studenten: Student[];
  assessment: TeamAssessment | undefined;
  onSaveAssessment: (assessment: TeamAssessment) => void;
  onNavigateBack: () => void;
}

export default function AssessmentView({
  team,
  groep,
  studenten,
  assessment,
  onSaveAssessment,
  onNavigateBack
}: AssessmentViewProps) {
  const teamStudents = studenten.filter(s => s.teamId === team.id);
  // Support teams of 1 (solo) or 2 (duo) students. Fall back to a single
  // placeholder only for the degenerate "no students assigned" config.
  const students = teamStudents.length > 0
    ? teamStudents
    : [{ id: "s1", name: "Student A" }];
  const isSolo = students.length === 1;
  const s1 = students[0]; // convenience alias for the first student

  // Local working copy of the assessment backed by defaults
  const getDefaultAssessmentState = (): TeamAssessment => {
    const fresh: TeamAssessment = {
      teamId: team.id,
      groepId: groep.id,
      studentAssessments: Object.fromEntries(
        students.map(s => [s.id, { scores: {}, isDuo: {}, notes: {} }])
      ),
      status: "not_started"
    };
    return assessment || fresh;
  };

  const [localAssessment, setLocalAssessment] = useState<TeamAssessment>(getDefaultAssessmentState());
  const [activeTab, setActiveTab] = useState<number>(1); // 1 to 6 coordinates to the 6 criteria
  const [activeNotePickerTag, setActiveNotePickerTag] = useState<{ tagText: string, critId: number } | null>(null);
  const [scriptOpen, setScriptOpen] = useState<boolean>(false); // Gespreksscript-leidraad overlay

  // Auto-grow ref
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Helper to trigger save on change
  const updateLocalAndSave = (updated: TeamAssessment) => {
    // Calculate status on the fly based on completion.
    // To be completed, EVERY student must have all 6 criteria scored.
    const scoredCount = (sId: string) =>
      Object.keys(updated.studentAssessments[sId]?.scores || {}).length;

    const allComplete = students.every(s => scoredCount(s.id) === 6);
    const anyStarted = students.some(s => scoredCount(s.id) > 0);

    let status: "not_started" | "partial" | "completed" = "not_started";
    if (allComplete) {
      status = "completed";
    } else if (anyStarted) {
      status = "partial";
    }

    const nextAss = { ...updated, status };
    setLocalAssessment(nextAss);
    onSaveAssessment(nextAss);
  };

  // Duo score toggle state per criterium. Meaningless for solo (always false).
  const isCriteriumDuo = (critId: number): boolean => {
    if (isSolo) return false;
    return students.some(s => localAssessment.studentAssessments[s.id]?.isDuo[critId]) || false;
  };

  const toggleDuoScore = (critId: number) => {
    if (isSolo) return;
    const isCurrentlyDuo = isCriteriumDuo(critId);
    const nextAss = JSON.parse(JSON.stringify(localAssessment)) as TeamAssessment;

    // Set toggle for all students
    students.forEach(s => {
      if (nextAss.studentAssessments[s.id]) {
        nextAss.studentAssessments[s.id].isDuo[critId] = !isCurrentlyDuo;
      }
    });

    // If aligning to DUO, replicate the first student's score & notes to the rest
    if (!isCurrentlyDuo) {
      const score = nextAss.studentAssessments[s1.id]?.scores[critId];
      const noteS1 = nextAss.studentAssessments[s1.id]?.notes[critId] || "";
      students.slice(1).forEach(s => {
        if (score !== undefined) {
          nextAss.studentAssessments[s.id].scores[critId] = score;
        }
        if (noteS1) {
          nextAss.studentAssessments[s.id].notes[critId] = noteS1;
        }
      });
    }

    updateLocalAndSave(nextAss);
  };

  // Set score level for student (or duo if matched)
  const setScore = (studentId: string, critId: number, level: LevelType | null) => {
    const nextAss = JSON.parse(JSON.stringify(localAssessment)) as TeamAssessment;
    const duo = isCriteriumDuo(critId);

    const val = level ? LEVEL_SCORES[level] : null;

    const applyToSingle = (sId: string) => {
      if (!nextAss.studentAssessments[sId]) {
        nextAss.studentAssessments[sId] = { scores: {}, isDuo: {}, notes: {} };
      }
      if (val === null) {
        delete nextAss.studentAssessments[sId].scores[critId];
      } else {
        nextAss.studentAssessments[sId].scores[critId] = val;
      }
    };

    if (duo) {
      students.forEach(s => applyToSingle(s.id));
    } else {
      applyToSingle(studentId);
    }

    updateLocalAndSave(nextAss);
  };

  // Completely wipe a single student's assessment (all criteria) and start over.
  // The team-mate's data is untouched; we also clear isDuo so no criterium is
  // left half-synced after the reset.
  const resetStudentAssessment = (studentId: string) => {
    const stud = students.find(s => s.id === studentId);
    const confirmed = window.confirm(
      `Weet je zeker dat je de volledige beoordeling van ${stud?.name || "deze student"} wilt verwijderen?\n\nAlle scores en notities (alle 6 criteria) worden gewist. Dit kan niet ongedaan worden gemaakt.`
    );
    if (!confirmed) return;

    const nextAss = JSON.parse(JSON.stringify(localAssessment)) as TeamAssessment;
    nextAss.studentAssessments[studentId] = { scores: {}, isDuo: {}, notes: {} };
    updateLocalAndSave(nextAss);
  };

  // Does this student have any scores or notes worth resetting?
  const studentHasData = (studentId: string): boolean => {
    const sa = localAssessment.studentAssessments[studentId];
    if (!sa) return false;
    const hasScores = Object.keys(sa.scores).length > 0;
    const hasNotes = (Object.values(sa.notes) as string[]).some(n => (n || "").trim().length > 0);
    return hasScores || hasNotes;
  };

  // Get score level for student
  const getScoreLevel = (studentId: string, critId: number): LevelType | null => {
    const val = localAssessment.studentAssessments[studentId]?.scores[critId];
    if (!val) return null;
    if (val === 1) return "Onder";
    if (val === 2) return "Op";
    if (val === 3) return "Boven";
    if (val === 4) return "Excellent";
    return null;
  };

  // Modify text notes
  const setNotesValue = (studentId: string, critId: number, text: string) => {
    const nextAss = JSON.parse(JSON.stringify(localAssessment)) as TeamAssessment;
    const duo = isCriteriumDuo(critId);

    const applyNote = (sId: string) => {
      if (!nextAss.studentAssessments[sId]) {
        nextAss.studentAssessments[sId] = { scores: {}, isDuo: {}, notes: {} };
      }
      nextAss.studentAssessments[sId].notes[critId] = text;
    };

    if (duo) {
      students.forEach(s => applyNote(s.id));
    } else {
      applyNote(studentId);
    }

    setLocalAssessment(nextAss);
    onSaveAssessment(nextAss);
  };

  // Tag interactions: Check if tag is placed in the notes (contains "✓ tag_text")
  const isTagUsedInNotes = (studentId: string, critId: number, tagText: string): boolean => {
    const text = localAssessment.studentAssessments[studentId]?.notes[critId] || "";
    return text.includes(`✓ ${tagText}`);
  };

  // Add/Remove tag to/from note field directly
  const toggleTagInNotes = (studentId: string, critId: number, tagText: string) => {
    const text = localAssessment.studentAssessments[studentId]?.notes[critId] || "";
    const needle = `✓ ${tagText}`;
    let newText = "";

    if (text.includes(needle)) {
      // Remove tag and clean empty spaces/lines
      newText = text.replace(needle, "").trim();
    } else {
      // Add tag on a new line
      newText = text ? `${text}\n✓ ${tagText}` : `✓ ${tagText}`;
    }

    setNotesValue(studentId, critId, newText);
  };

  const handleTagClick = (tagText: string, critId: number) => {
    const duo = isCriteriumDuo(critId);
    if (duo) {
      // Apply immediately to all students since it's duo
      students.forEach(s => toggleTagInNotes(s.id, critId, tagText));
    } else if (isSolo) {
      // No picker needed for a single student — apply directly
      toggleTagInNotes(s1.id, critId, tagText);
    } else {
      // Open Student picker popup in UI
      setActiveNotePickerTag({ tagText, critId });
    }
  };

  const handlePickerAssign = (studentId: string) => {
    if (!activeNotePickerTag) return;
    toggleTagInNotes(studentId, activeNotePickerTag.critId, activeNotePickerTag.tagText);
    setActiveNotePickerTag(null);
  };

  // Drag constraints helper
  const handleDragStartTag = (e: React.DragEvent, tagText: string, critId: number) => {
    e.dataTransfer.setData("text/tag", tagText);
    e.dataTransfer.setData("text/critId", critId.toString());
  };

  const handleDropTag = (e: React.DragEvent, studentId: string, critId: number) => {
    e.preventDefault();
    const tagText = e.dataTransfer.getData("text/tag");
    const incomingCritId = Number(e.dataTransfer.getData("text/critId"));

    if (tagText && incomingCritId === critId) {
      toggleTagInNotes(studentId, critId, tagText);
    }
  };

  // Auto-fill suggested evaluations from Gemini
  const handleApplyAiSuggestions = (
    scores: Record<string, Record<number, number>>,
    tags: Record<string, Record<number, string[]>>,
    reasoning: Record<string, Record<number, string>>,
    feedback: Record<string, { strengths: string[], improvements: string[] }>
  ) => {
    const nextAss = JSON.parse(JSON.stringify(localAssessment)) as TeamAssessment;

    // Apply scores & generate Dutch formatted tags and text
    const applyToStudent = (origKey: string, targetStudentId: string) => {
      const studentAss = nextAss.studentAssessments[targetStudentId] || { scores: {}, isDuo: {}, notes: {} };
      
      const sScores = scores[origKey] || {};
      const sTags = tags[origKey] || {};
      const sReasoning = reasoning[origKey] || {};

      CRITERIA.forEach((crit) => {
        const val = sScores[crit.id];
        if (val) {
          studentAss.scores[crit.id] = val;
        }

        const critTags = sTags[crit.id] || [];
        const critReason = sReasoning[crit.id] || "";
        
        let existingNotes = studentAss.notes[crit.id] || "";
        
        // Formulate checklist format with markers
        const tagMarkers = critTags.map((tag: string) => `✓ ${tag}`).join("\n");
        const composite = `${tagMarkers}\n\n${critReason}`.trim();

        studentAss.notes[crit.id] = composite;
      });

      nextAss.studentAssessments[targetStudentId] = studentAss;
    };

    // Map the AI's keys to the actual students by order, bounded to the real
    // students. This guarantees no fabricated/ghost key can ever be applied.
    const originalKeys = Object.keys(scores);
    students.forEach((stud, i) => {
      if (originalKeys[i]) {
        applyToStudent(originalKeys[i], stud.id);
      }
    });

    updateLocalAndSave(nextAss);
  };

  const currentCriterium = CRITERIA.find(c => c.id === activeTab)!;

  return (
    <div className="space-y-6" id="assessment-workspace">
      {/* Upper navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onNavigateBack}
            className="p-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
            id="back-to-cal-btn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">PROMEF {isSolo ? "SOLO" : "DUO"} ASSESSMENT</span>
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
              Team {team.teamNummer}: {students.map(s => s.name).join(" & ")}
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">Klas: {groep.name} &middot; Assessoren: {groep.assessoren.join(" & ")}</p>
          </div>

          <button
            onClick={() => setScriptOpen(true)}
            id="open-gespreksscript-btn"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors shadow-sm focus:outline-none cursor-pointer"
            title="Open de gesprekleidraad met vragen per criterium"
          >
            <ScrollText size={14} className="text-indigo-600" />
            <span>Gespreksscript</span>
          </button>
        </div>

        {/* Scoring overview bar */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 font-sans">
          {CRITERIA.map((crit) => {
            const isCompleted = students.every(s => getScoreLevel(s.id, crit.id) !== null);
            const isPartial = students.some(s => getScoreLevel(s.id, crit.id) !== null);

            let color = "bg-slate-50 border-slate-200 text-slate-450 hover:bg-slate-100";
            if (isCompleted) {
              color = "bg-indigo-600 border-indigo-600 text-white shadow-sm";
            } else if (isPartial) {
              color = "bg-amber-100 border-amber-200 text-amber-805";
            }

            return (
              <button
                key={crit.id}
                onClick={() => setActiveTab(crit.id)}
                className={`flex-1 sm:flex-none text-[11px] font-extrabold px-3.5 py-2 rounded-xl border min-w-[38px] text-center cursor-pointer transition-all ${color} ${activeTab === crit.id ? "ring-2 ring-indigo-500 ring-offset-1" : ""}`}
                title={`${crit.title}`}
              >
                C{crit.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main split screen: workspace on left, AI copilot Scribe on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Workspace panel (2/3 width on wide screens) */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          
          {/* Active Criterium Info Block */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="flex-1">
                <span className="text-[10px] font-extrabold text-indigo-650 uppercase tracking-widest block mb-1">PROMEF CRITERIUM {currentCriterium.id}</span>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{currentCriterium.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentCriterium.description}</p>
              </div>

              {/* Duo score toggle — only meaningful with two students */}
              {!isSolo && (
                <div className="shrink-0 flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-2xl py-2 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                  <input
                    type="checkbox"
                    id={`duo-toggle-${currentCriterium.id}`}
                    checked={isCriteriumDuo(currentCriterium.id)}
                    onChange={() => toggleDuoScore(currentCriterium.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 focus:outline-none w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor={`duo-toggle-${currentCriterium.id}`} className="text-xs font-bold text-slate-600 cursor-pointer uppercase tracking-wider">
                    Duo-score
                  </label>
                </div>
              )}
            </div>

            {/* Micro Observation-Chips Picker Area */}
            <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/50 mb-6">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">OBSERVATIE-TAGS (KOPPEL OF SLEEP NAAR NOTITIES)</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {(["Onder", "Op", "Boven", "Excellent"] as LevelType[]).map((level) => {
                  const tags = currentCriterium.tagsByLevel[level] || [];
                  
                  let grpColor = "border-red-100 bg-red-50/50";
                  let titleColor = "text-red-700";
                  if (level === "Op") { grpColor = "border-amber-100 bg-amber-50/50"; titleColor = "text-amber-700"; }
                  if (level === "Boven") { grpColor = "border-emerald-100 bg-emerald-50/50"; titleColor = "text-emerald-700"; }
                  if (level === "Excellent") { grpColor = "border-indigo-100 bg-indigo-50/50"; titleColor = "text-indigo-700"; }

                  return (
                    <div key={level} className={`border rounded-xl p-3 space-y-2.5 flex flex-col ${grpColor}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest block border-b border-black/5 pb-1 ${titleColor}`}>{level}</span>
                      <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                        {tags.map((tag) => {
                          const usedBy = students.filter(s => isTagUsedInNotes(s.id, currentCriterium.id, tag));

                          return (
                            <div key={tag} className="relative inline-block">
                              <button
                                draggable
                                onDragStart={(e) => handleDragStartTag(e, tag, currentCriterium.id)}
                                onClick={() => handleTagClick(tag, currentCriterium.id)}
                                className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center space-x-1 ${
                                  usedBy.length > 0
                                    ? "bg-slate-800 border-slate-900 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                                title="Klik om student te selecteren; sleep tag naar een notitieveld om direct in te voegen"
                              >
                                <span>{tag}</span>
                                <div className="flex space-x-0.5 text-[8px] font-semibold text-slate-350">
                                  {usedBy.map(s => (
                                    <span key={s.id} className="bg-slate-750 text-white rounded-[2px] px-0.5">{(s.name || "?")[0]}</span>
                                  ))}
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note assign student popup */}
            {activeNotePickerTag && activeNotePickerTag.critId === currentCriterium.id && (
              <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-xl fixed sm:absolute z-50 flex flex-col space-y-3.5 max-w-xs animate-fade-in" id="tag-picker-popup">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">VOEG TAG "{activeNotePickerTag.tagText}" TOE AAN:</span>
                <div className="flex gap-2">
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handlePickerAssign(s.id)}
                      className="flex-1 text-xs py-2 px-3 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-705 cursor-pointer transition-colors"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveNotePickerTag(null)}
                  className="text-center text-[10px] text-red-600 hover:text-red-800 pt-1 font-bold uppercase tracking-wider"
                >
                  Annuleren
                </button>
              </div>
            )}

            {/* Per-student workspaces (1 column for solo, 2 for duo) */}
            <div className={`grid grid-cols-1 ${isSolo ? "" : "md:grid-cols-2"} gap-5`} id="criteria-students-grid">

              {students.map((stud, idx) => {
                // For duo criteria, the non-first student is synced (read-only)
                const isSyncedSlave = idx > 0 && isCriteriumDuo(currentCriterium.id);

                return (
                  <div
                    key={stud.id}
                    className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col shadow-sm"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropTag(e, stud.id, currentCriterium.id)}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5 uppercase tracking-wide">
                        <User size={15} className="text-slate-400" />
                        <span>{stud.name}</span>
                      </span>
                      <button
                        onClick={() => resetStudentAssessment(stud.id)}
                        disabled={!studentHasData(stud.id)}
                        className="flex items-center space-x-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none"
                        title={`Volledige beoordeling van ${stud.name} wissen en opnieuw beginnen`}
                      >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Level selection buttons */}
                    <div className="grid grid-cols-4 gap-1 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-xl bg-slate-100 border border-slate-200">
                      {(["Onder", "Op", "Boven", "Excellent"] as LevelType[]).map((level) => {
                        const active = getScoreLevel(stud.id, currentCriterium.id) === level;

                        let bgActiveClasses = "bg-red-500 hover:bg-red-600 text-white shadow-sm";
                        if (level === "Op") bgActiveClasses = "bg-amber-500 hover:bg-amber-600 text-white shadow-sm";
                        if (level === "Boven") bgActiveClasses = "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm";
                        if (level === "Excellent") bgActiveClasses = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm";

                        return (
                          <button
                            key={level}
                            disabled={isSyncedSlave}
                            onClick={() => setScore(stud.id, currentCriterium.id, active ? null : level)}
                            className={`text-[9px] font-extrabold py-2 px-1 text-center cursor-pointer disabled:opacity-50 transition-all rounded-lg uppercase tracking-wider ${
                              active
                                ? bgActiveClasses
                                : "bg-transparent text-slate-600 hover:bg-white/50"
                            }`}
                            title={isSyncedSlave ? "Gesynchroniseerd via Duo-score" : ""}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>

                    {/* Text Notes box */}
                    <div className="flex-1 flex flex-col space-y-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">NOTITIES & OBSERVATIES (✓ TAGS)</span>
                      <textarea
                        disabled={isSyncedSlave}
                        ref={(el) => { textareaRefs.current[`${stud.id}-${currentCriterium.id}`] = el; }}
                        value={localAssessment.studentAssessments[stud.id]?.notes[currentCriterium.id] || ""}
                        onChange={(e) => setNotesValue(stud.id, currentCriterium.id, e.target.value)}
                        placeholder={isSyncedSlave ? "Gesynchroniseerd via Duo-score..." : `Opmerkingen over ${stud.name}...`}
                        rows={6}
                        className="w-full flex-1 p-4 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:shadow-sm transition-all disabled:opacity-75 font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Bottom buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-5 border-t border-slate-200/60 gap-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Auto-saving locally to browser storage...</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentCriterium.id > 1 && (
                  <button 
                    onClick={() => setActiveTab(currentCriterium.id - 1)}
                    className="flex-1 sm:flex-none py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all uppercase tracking-wider shadow-sm"
                  >
                    ← Vorig Criterium
                  </button>
                )}
                {currentCriterium.id < 6 ? (
                  <button 
                    onClick={() => setActiveTab(currentCriterium.id + 1)}
                    className="flex-1 sm:flex-none py-2 px-4 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white rounded-xl text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center space-x-1.5 uppercase tracking-wider shadow-sm"
                  >
                    <span>Volgend Criterium</span>
                    <ChevronRight size={12} />
                  </button>
                ) : (
                  <button 
                    onClick={onNavigateBack}
                    className="flex-1 sm:flex-none py-2 px-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all uppercase tracking-wider shadow-sm"
                  >
                    ✓ Afronden naar Kalender
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* AI Notulist Scribe panel (1/3 width on wide screens) */}
        <div className="xl:col-span-1" id="ai-notulist-sidebar">
          <AiNotulistPanel
            students={students.map(s => ({ id: s.id, name: s.name }))}
            onApplySuggestions={handleApplyAiSuggestions}
          />
        </div>

      </div>

      {scriptOpen && (
        <GespreksscriptModal
          students={students.map(s => ({ id: s.id, name: s.name }))}
          klas={groep.name}
          datum={groep.datum}
          teamNummer={team.teamNummer}
          assessoren={groep.assessoren}
          onClose={() => setScriptOpen(false)}
        />
      )}
    </div>
  );
}
