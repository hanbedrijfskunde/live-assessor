import React, { useState } from "react";
import { Groep, Team, Student, TeamAssessment } from "../types";
import { formatDutchDate, generateTimeSlots, timeToMinutes } from "../utils";
import { Plus, X, Calendar, ClipboardCheck, Users, CalendarDays } from "lucide-react";
import AssessorenEditor from "./AssessorenEditor";

interface CalendarOverviewProps {
  groepen: Groep[];
  teams: Team[];
  studenten: Student[];
  assessments: Record<string, TeamAssessment>;
  onSelectTeam: (teamId: string) => void;
  onModifyPauze: (groepId: string, slotTime: string, action: "add" | "remove") => void;
  onMoveTeam: (teamId: string, newSlotTime: string | null) => void;
  onNavigateToStudents: () => void;
  onUpdateGroep: (groepId: string, patch: Partial<Groep>) => void;
}

export default function CalendarOverview({
  groepen,
  teams,
  studenten,
  assessments,
  onSelectTeam,
  onModifyPauze,
  onMoveTeam,
  onNavigateToStudents,
  onUpdateGroep
}: CalendarOverviewProps) {
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const [editingGroepId, setEditingGroepId] = useState<string | null>(null);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData("text/plain", teamId);
    setDraggedTeamId(teamId);
  };

  const handleDragEnd = () => {
    setDraggedTeamId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetGroepId: string, slotTime: string | null) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData("text/plain") || draggedTeamId;
    if (!teamId) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Only allow dropping within the SAME group to manage sequence, according to the PRD:
    // "teams kunnen versleept worden naar een ander tijdslot binnen dezelfde dag om de volgorde aan te passen."
    if (team.groepId === targetGroepId) {
      onMoveTeam(teamId, slotTime);
    }
  };

  // Calculate assessment statistics
  const totalTeams = teams.length;
  const completedAssessmentsCount = Object.values(assessments).filter(
    a => a.status === "completed"
  ).length;
  const partialAssessmentsCount = Object.values(assessments).filter(
    a => a.status === "partial"
  ).length;

  const completionRate = totalTeams > 0 ? Math.round((completedAssessmentsCount / totalTeams) * 100) : 0;

  return (
    <div className="space-y-6" id="dashboard-container font-sans">
      {/* Top statistics section - Bento layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm transition-all" id="stat-progress">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ClipboardCheck size={24} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block mb-1 text-slate-400">Voortgang Assessment-cyclus</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-800 tracking-tight">{completedAssessmentsCount} / {totalTeams}</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">voltooid</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm transition-all" id="stat-partial">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block mb-1 text-slate-400">Deels Beoordeeld (Tussentijds)</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{partialAssessmentsCount}</div>
            <div className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1 uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Nog actieve gesprekken
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm transition-all" id="stat-unassessed">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block mb-1 text-slate-400">Totaal Deelnemende Teams</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalTeams}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">
              {studenten.length} studenten &middot; {groepen.length} klassen
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar columns (side by side on wide, stacked on mobile) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="calendar-grid">
        {groepen.map((groep) => {
          const groupSlots = generateTimeSlots(groep.startTime, groep.endTime, groep.slotDuration);
          const groupTeams = teams.filter(t => t.groepId === groep.id);

          return (
            <div key={groep.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col" id={`group-col-${groep.id}`}>
              {/* Header */}
              <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">PROMEF KLASGROEP</span>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center space-x-2">
                    <Calendar size={18} className="text-indigo-600" />
                    <span>{groep.name}</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{formatDutchDate(groep.datum)} | {groep.startTime} - {groep.endTime}</p>
                </div>
                <div className="text-left sm:text-right">
                  {editingGroepId === groep.id ? (
                    <div className="flex items-center gap-2 justify-start sm:justify-end">
                      <AssessorenEditor
                        assessoren={groep.assessoren ?? []}
                        onChange={(next) => onUpdateGroep(groep.id, { assessoren: next })}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingGroepId(null)}
                        aria-label={`Klaar met assessoren bewerken voor ${groep.name}`}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-200 rounded uppercase tracking-wider"
                      >
                        Klaar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingGroepId(groep.id)}
                      aria-label={`Bewerk assessoren voor ${groep.name}`}
                      title={`Klik om assessoren te bewerken voor ${groep.name}`}
                      className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-wider cursor-pointer"
                    >
                      Assessoren: {(groep.assessoren ?? []).length > 0 ? groep.assessoren.join(" & ") : "—"}
                    </button>
                  )}
                </div>
              </div>

              {/* Time slots scheduler */}
              <div className="p-5 flex-1">
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {groupSlots.map((slotTime) => {
                    // Check if there is a team in this slot
                    const teamInSlot = groupTeams.find(t => t.slotTime === slotTime);
                    const isPauze = groep.pauzes.includes(slotTime);

                    return (
                      <div 
                        key={slotTime}
                        className="flex items-stretch space-x-3 group/row transition-all min-h-[56px]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, groep.id, slotTime)}
                      >
                        {/* Time label */}
                        <div className="w-14 items-center justify-center flex font-mono text-xs font-bold text-slate-400">
                          {slotTime}
                        </div>

                        {/* Event box (Team card, Pause, or Empty dropzone) */}
                        <div className="flex-1 rounded-2xl border border-dashed border-slate-200 relative transition-all bg-slate-50/20 flex items-stretch overflow-hidden">
                          {isPauze ? (
                            /* Pause box */
                            <div className="flex-1 bg-amber-50/60 text-amber-900 px-4 py-2 border-l-4 border-l-amber-500 flex justify-between items-center text-xs font-bold uppercase tracking-wider group transition-all">
                              <span className="flex items-center space-x-2">
                                <span className="p-1 bg-amber-100 rounded text-amber-700">☕</span>
                                <span>Pauze</span>
                              </span>
                              <button 
                                onClick={() => onModifyPauze(groep.id, slotTime, "remove")}
                                title="Verwijder pauze"
                                className="text-amber-400 hover:text-amber-700 p-1 rounded-full transition-colors focus:outline-none"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : teamInSlot ? (
                            /* Draggable team card */
                            (() => {
                              const examOfTeam = assessments[teamInSlot.id];
                              const status = examOfTeam ? examOfTeam.status : "not_started";
                              
                              // Visual flags according to PRD sequence
                              let statusClasses = "bg-white hover:border-slate-300 border-slate-200 border-l-slate-400";
                              let statusBadge = "Onbeoordeeld";
                              let badgeColor = "bg-slate-100 text-slate-600";
                              
                              if (status === "completed") {
                                statusClasses = "bg-emerald-50/40 hover:bg-emerald-100/30 border-emerald-100 border-l-4 border-l-emerald-500";
                                statusBadge = "Voltooid";
                                badgeColor = "bg-emerald-100 text-emerald-800";
                              } else if (status === "partial") {
                                statusClasses = "bg-amber-50/30 hover:bg-amber-100/20 border-amber-100 border-l-4 border-l-amber-500";
                                statusBadge = "Deels beoordeeld";
                                badgeColor = "bg-amber-100 text-amber-800";
                              } else {
                                statusClasses = "bg-white border-l-4 border-l-slate-450";
                              }

                              const teammates = studenten.filter(s => s.teamId === teamInSlot.id);
                              const teammateNames = teammates.map(s => s.name).join(" & ");

                              return (
                                <div 
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, teamInSlot.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => onSelectTeam(teamInSlot.id)}
                                  className={`flex-1 flex justify-between items-center rounded-2xl border p-3.5 cursor-grab active:cursor-grabbing transition-all ${statusClasses} shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}
                                  title="Sleep om volgorde te veranderen. Klik om assessment te starten."
                                  id={`team-card-${teamInSlot.id}`}
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-extrabold text-slate-800 text-sm">Team {teamInSlot.teamNummer}</span>
                                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}`}>
                                        {statusBadge}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-slate-550 mt-1 truncate">
                                      {teammateNames || "Geen studenten toegewezen"}
                                    </h4>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-sm">
                                      EVALUEER &rarr;
                                    </span>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            /* Empty dropzone block */
                            <div 
                              className="flex-1 flex justify-between items-center px-4 py-2 hover:bg-slate-50/50 transition-colors cursor-pointer text-slate-400 group-hover/row:text-slate-600 text-xs font-semibold border-l-4 border-l-transparent"
                              onClick={() => onModifyPauze(groep.id, slotTime, "add")}
                              title="Klik om een pauze toe te voegen"
                            >
                              <span className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center space-x-1 font-bold text-indigo-650">
                                <Plus size={14} />
                                <span className="uppercase tracking-wider text-[10px]">Voeg Pauze Toe</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Leeg</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm" id="calendar-empty">
          <CalendarDays size={42} className="mx-auto text-slate-400" />
          <h4 className="text-base font-extrabold text-slate-800 mt-4 uppercase tracking-wider">Geen assessment data ingeladen</h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Om de kalender te gebruiken, kun je een voorbeeldset inladen of handmatig groepen en studenten configureren via Studentenbeheer.
          </p>
          <button 
            onClick={onNavigateToStudents}
            className="mt-5 inline-flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md focus:outline-none uppercase tracking-wider cursor-pointer"
          >
            <span>Laadhulpmiddelen openen</span>
          </button>
        </div>
      )}
    </div>
  );
}
