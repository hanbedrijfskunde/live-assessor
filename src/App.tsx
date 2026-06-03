import React, { useState, useEffect } from "react";
import { Groep, Team, Student, TeamAssessment } from "./types";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  parseCSV,
  generateTimeSlots,
  timeToMinutes,
  minutesToTime
} from "./utils";

import CalendarOverview from "./components/CalendarOverview";
import AssessmentView from "./components/AssessmentView";
import ResultsView from "./components/ResultsView";
import FeedbackView from "./components/FeedbackView";
import StudentManager from "./components/StudentManager";
import DataManager from "./components/DataManager";

import { Calendar, ClipboardList, Users, Database, Sparkles, BookOpen, GraduationCap } from "lucide-react";

export default function App() {
  // Main states
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [studenten, setStudenten] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Record<string, TeamAssessment>>({});

  // View States
  // views: "dashboard" | "results" | "students" | "data" | "assessment" | "feedback"
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeStudentFeedbackId, setActiveStudentFeedbackId] = useState<string | null>(null);

  // Load database on mount
  useEffect(() => {
    // Fresh browsers start empty; the demo roster is loaded on demand from
    // public/demo.csv via "Laad Voorbeeldset" (see handleLoadExampleData).
    const loadedGroepen = loadFromLocalStorage<Groep[]>("promef_groepen", []);
    const loadedTeams = loadFromLocalStorage<Team[]>("promef_teams", []);
    const loadedStudenten = loadFromLocalStorage<Student[]>("promef_studenten", []);
    const loadedAssessments = loadFromLocalStorage<Record<string, TeamAssessment>>("promef_assessments", {});

    setGroepen(loadedGroepen);
    setTeams(loadedTeams);
    setStudenten(loadedStudenten);
    setAssessments(loadedAssessments);
  }, []);

  // Update localStorage helper
  const updateAndSaveGroepen = (newG: Groep[]) => {
    setGroepen(newG);
    saveToLocalStorage("promef_groepen", newG);
  };

  const updateAndSaveTeams = (newT: Team[]) => {
    setTeams(newT);
    saveToLocalStorage("promef_teams", newT);
  };

  const updateAndSaveStudenten = (newS: Student[]) => {
    setStudenten(newS);
    saveToLocalStorage("promef_studenten", newS);
  };

  const updateAndSaveAssessments = (newA: Record<string, TeamAssessment>) => {
    setAssessments(newA);
    saveToLocalStorage("promef_assessments", newA);
  };

  // Callback implementations
  const handleAddGroep = (g: Groep) => {
    const updated = [...groepen, g];
    updateAndSaveGroepen(updated);
  };

  const handleUpdateGroep = (groepId: string, patch: Partial<Groep>) => {
    const updated = groepen.map(g => (g.id === groepId ? { ...g, ...patch } : g));
    updateAndSaveGroepen(updated);
  };

  const handleDeleteGroep = (groepId: string) => {
    // Cascade-deletion according to PRD: deleting group wipes associated teams and students too
    const nextG = groepen.filter(g => g.id !== groepId);
    const nextT = teams.filter(t => t.groepId !== groepId);
    const nextS = studenten.filter(s => s.groepId !== groepId);
    
    // Wipe assessments of the deleted teams
    const nextA = { ...assessments };
    teams.forEach(t => {
      if (t.groepId === groepId) {
        delete nextA[t.id];
      }
    });

    updateAndSaveGroepen(nextG);
    updateAndSaveTeams(nextT);
    updateAndSaveStudenten(nextS);
    updateAndSaveAssessments(nextA);
  };

  // Bulk Team creation distributed over slots skipping 12:00 pause
  const handleAddTeamsBulk = (groepId: string, count: number) => {
    const targetG = groepen.find(g => g.id === groepId);
    if (!targetG) return;

    // Remove existing teams in this group first to prevent collision duplicates
    const untouchedTeams = teams.filter(t => t.groepId !== groepId);
    
    const slots = generateTimeSlots(targetG.startTime, targetG.endTime, targetG.slotDuration);
    const newGTeams: Team[] = [];

    let currentSlotIndex = 0;

    for (let i = 1; i <= count; i++) {
      let slotTimeStr: string | null = null;
      
      // Look for a suitable non-pause time slot
      while (currentSlotIndex < slots.length) {
        const potentialTime = slots[currentSlotIndex];
        const isPauze = targetG.pauzes.includes(potentialTime);
        
        currentSlotIndex++;

        if (!isPauze) {
          slotTimeStr = potentialTime;
          break;
        }
      }

      newGTeams.push({
        id: `t-${targetG.id}-${i}`,
        groepId,
        teamNummer: i.toString(),
        slotTime: slotTimeStr // can be null if running out of hours
      });
    }

    const updated = [...untouchedTeams, ...newGTeams];
    updateAndSaveTeams(updated);
  };

  const handleDeleteTeam = (teamId: string) => {
    const nextT = teams.filter(t => t.id !== teamId);
    const nextS = studenten.filter(s => s.teamId !== teamId);
    const nextA = { ...assessments };
    delete nextA[teamId];

    updateAndSaveTeams(nextT);
    updateAndSaveStudenten(nextS);
    updateAndSaveAssessments(nextA);
  };

  const handleAddStudent = (s: Student) => {
    const updated = [...studenten, s];
    updateAndSaveStudenten(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = studenten.filter(s => s.id !== studentId);
    updateAndSaveStudenten(updated);
  };

  const handleModifyPauze = (groepId: string, slotTime: string, action: "add" | "remove") => {
    const nextG = groepen.map((g) => {
      if (g.id !== groepId) return g;
      const nextPauzes = action === "add" 
        ? [...g.pauzes, slotTime] 
        : g.pauzes.filter(p => p !== slotTime);
      return { ...g, pauzes: nextPauzes };
    });

    // If adding a pause in a slot that has a team, eject that team's timeslot to unassigned (null)
    let nextT = [...teams];
    if (action === "add") {
      nextT = teams.map((t) => {
        if (t.groepId === groepId && t.slotTime === slotTime) {
          return { ...t, slotTime: null };
        }
        return t;
      });
    }

    updateAndSaveGroepen(nextG);
    updateAndSaveTeams(nextT);
  };

  // Drag and drop scheduler rearrangement helper
  const handleMoveTeam = (teamId: string, newSlotTime: string | null) => {
    const teamToMove = teams.find(t => t.id === teamId);
    if (!teamToMove) return;

    const targetGroepId = teamToMove.groepId;

    const nextT = teams.map((t) => {
      if (t.groepId !== targetGroepId) return t;

      // Swap handling if another team holds the target slot
      if (newSlotTime !== null && t.slotTime === newSlotTime) {
        return { ...t, slotTime: teamToMove.slotTime }; // receives old slot of moved team
      }

      if (t.id === teamId) {
        return { ...t, slotTime: newSlotTime };
      }

      return t;
    });

    updateAndSaveTeams(nextT);
  };

  const handleSaveAssessment = (ass: TeamAssessment) => {
    const nextA = { ...assessments, [ass.teamId]: ass };
    updateAndSaveAssessments(nextA);
  };

  const handleImportData = (groups: Groep[], tList: Team[], sList: Student[]) => {
    updateAndSaveGroepen(groups);
    updateAndSaveTeams(tList);
    updateAndSaveStudenten(sList);
    updateAndSaveAssessments({}); // reset scores when starting fresh csv state
  };

  const handleRestoreBackup = (backup: any) => {
    updateAndSaveGroepen(backup.groepen || []);
    updateAndSaveTeams(backup.teams || []);
    updateAndSaveStudenten(backup.studenten || []);
    updateAndSaveAssessments(backup.assessments || {});
  };

  // Demo roster lives in public/demo.csv (no real names in source). Fetch it,
  // parse with the same CSV pipeline as a manual import, and load it as a fresh
  // (unscored) cohort. Throws on failure so the caller can surface an error.
  const handleLoadExampleData = async () => {
    const res = await fetch("/demo.csv");
    if (!res.ok) throw new Error(`Kon demo.csv niet laden (${res.status})`);
    const text = await res.text();
    const { groups, teams: tList, students: sList } = parseCSV(text);
    handleImportData(groups, tList, sList);
  };

  const handleResetAllData = () => {
    updateAndSaveGroepen([]);
    updateAndSaveTeams([]);
    updateAndSaveStudenten([]);
    updateAndSaveAssessments({});
  };

  const handleSelectTeamForAssessment = (teamId: string) => {
    setActiveTeamId(teamId);
    setActiveView("assessment");
  };

  const handleSelectStudentFeedback = (studentId: string) => {
    setActiveStudentFeedbackId(studentId);
    setActiveView("feedback");
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col text-slate-905 font-sans" id="main-scaffold">
      
      {/* Visual Header */}
      <header className="no-print bg-white border-b border-slate-200 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">
              PROMEF <span className="text-indigo-600">Assessment Tool</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeView === "assessment" && activeTeamId 
                  ? `Sessie Actief: Assessment Team ${teams.find(t => t.id === activeTeamId)?.teamNummer || ""}` 
                  : activeView === "results" 
                  ? "Sessie Actief: Resultaten & Kwalificatiematrix" 
                  : activeView === "students" 
                  ? "Sessie Actief: Studenten- & Duo-configuratie" 
                  : activeView === "data" 
                  ? "Sessie Actief: Databeheer & Import" 
                  : "Sessie Actief: Kalenderoverzicht"}
              </span>
            </div>
          </div>
          
          {/* Main Web navigation tabs */}
          <nav className="flex flex-wrap items-center gap-2 font-sans">
            <button
              onClick={() => { setActiveView("dashboard"); setActiveTeamId(null); }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeView === "dashboard" || activeView === "assessment"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold" 
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Calendar size={14} />
              <span>Kalenderoverzicht</span>
            </button>

            <button
              onClick={() => { setActiveView("results"); setActiveStudentFeedbackId(null); }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeView === "results" 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold" 
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <ClipboardList size={14} />
              <span>Resultatenmatrix</span>
            </button>

            <button
              onClick={() => setActiveView("students")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeView === "students" 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold" 
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Users size={14} />
              <span>Studenten & Duo's</span>
            </button>

            <button
              onClick={() => setActiveView("data")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeView === "data" 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold" 
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Database size={14} />
              <span>Dataset & Import</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6" id="core-content-frame">
        {activeView === "dashboard" && (
          <CalendarOverview 
            groepen={groepen}
            teams={teams}
            studenten={studenten}
            assessments={assessments}
            onSelectTeam={handleSelectTeamForAssessment}
            onModifyPauze={handleModifyPauze}
            onMoveTeam={handleMoveTeam}
            onNavigateToStudents={() => setActiveView("students")}
            onUpdateGroep={handleUpdateGroep}
          />
        )}

        {activeView === "assessment" && activeTeamId && (() => {
          const team = teams.find(t => t.id === activeTeamId);
          const groep = team ? groepen.find(g => g.id === team.groepId) : undefined;
          
          if (!team || !groep) return <div className="text-center italic text-slate-400 py-10">Selecteerde team niet gevonden.</div>;

          return (
            <AssessmentView 
              team={team}
              groep={groep}
              studenten={studenten}
              assessment={assessments[team.id]}
              onSaveAssessment={handleSaveAssessment}
              onNavigateBack={() => setActiveView("dashboard")}
            />
          );
        })()}

        {activeView === "results" && (
          <ResultsView 
            groepen={groepen}
            teams={teams}
            studenten={studenten}
            assessments={assessments}
            onSelectStudentFeedback={handleSelectStudentFeedback}
          />
        )}

        {activeView === "feedback" && (
          <FeedbackView 
            groepen={groepen}
            teams={teams}
            studenten={studenten}
            assessments={assessments}
            initialStudentId={activeStudentFeedbackId || undefined}
            onNavigateBack={() => setActiveView("results")}
          />
        )}

        {activeView === "students" && (
          <StudentManager 
            groepen={groepen}
            teams={teams}
            studenten={studenten}
            onAddGroep={handleAddGroep}
            onDeleteGroep={handleDeleteGroep}
            onAddTeamsBulk={handleAddTeamsBulk}
            onDeleteTeam={handleDeleteTeam}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onUpdateGroep={handleUpdateGroep}
          />
        )}

        {activeView === "data" && (
          <DataManager 
            groepen={groepen}
            teams={teams}
            studenten={studenten}
            assessments={assessments}
            onImportData={handleImportData}
            onRestoreBackup={handleRestoreBackup}
            onLoadExampleData={handleLoadExampleData}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Human design footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto text-center text-[10px] text-slate-400 font-mono tracking-wider">
        HAN PROMEF EVALUATIE ENGINE v1.2.0 · INGEBOUWDE COMPLIANCE MET GECERTIFICEERDE RUBRICS
      </footer>
    </div>
  );
}
