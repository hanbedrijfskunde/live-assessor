import React, { useState } from "react";
import { Groep, Team, Student } from "../types";
import { generateId, timeToMinutes, minutesToTime } from "../utils";
import { Plus, Trash2, Users, FolderPlus, UserPlus, HelpCircle } from "lucide-react";

interface StudentManagerProps {
  groepen: Groep[];
  teams: Team[];
  studenten: Student[];
  onAddGroep: (groep: Groep) => void;
  onDeleteGroep: (groepId: string) => void;
  onAddTeamsBulk: (groepId: string, count: number) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export default function StudentManager({
  groepen,
  teams,
  studenten,
  onAddGroep,
  onDeleteGroep,
  onAddTeamsBulk,
  onDeleteTeam,
  onAddStudent,
  onDeleteStudent
}: StudentManagerProps) {
  // Add Group states
  const [newGroup, setNewGroup] = useState({
    name: "",
    assessoren: "Sonia, Mark",
    datum: "2026-04-07",
    startTime: "09:00",
    endTime: "13:30",
    slotDuration: "30"
  });

  // Bulk Teams states
  const [selectedGroupForBulk, setSelectedGroupForBulk] = useState<string>(groepen[0]?.id || "");
  const [bulkCount, setBulkCount] = useState<number>(5);

  // Add Student states
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState<string>(groepen[0]?.id || "");
  const [selectedTeamForStudent, setSelectedTeamForStudent] = useState<string>("");
  const [studentNameStr, setStudentNameStr] = useState<string>("");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    const g: Groep = {
      id: "g-" + generateId(),
      name: newGroup.name.trim().toUpperCase(),
      assessoren: newGroup.assessoren.split(",").map(a => a.trim()).filter(a => a.length > 0),
      datum: newGroup.datum,
      startTime: newGroup.startTime,
      endTime: newGroup.endTime,
      slotDuration: Number(newGroup.slotDuration),
      pauzes: ["12:00"] // setting default 12:00 pause according to PRD
    };

    onAddGroep(g);
    setNewGroup({
      ...newGroup,
      name: ""
    });
    // Set fallback selection references
    if (!selectedGroupForBulk) setSelectedGroupForBulk(g.id);
    if (!selectedGroupForStudent) setSelectedGroupForStudent(g.id);
  };

  const handleCreateBulkTeams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForBulk || bulkCount <= 0) return;
    onAddTeamsBulk(selectedGroupForBulk, bulkCount);
    alert(`${bulkCount} teams zijn succesvol aangemaakt en over de kalender-tijdslots ingeroosterd (lunchpauze 12:00 werd overgeslagen)!`);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameStr.trim() || !selectedGroupForStudent || !selectedTeamForStudent) return;

    const s: Student = {
      id: "s-" + generateId(),
      groepId: selectedGroupForStudent,
      teamId: selectedTeamForStudent,
      name: studentNameStr.trim()
    };

    onAddStudent(s);
    setStudentNameStr("");
  };

  const teamsInSelectedStudentGroup = teams.filter(t => t.groepId === selectedGroupForStudent);

  return (
    <div className="space-y-6" id="studenten-beheer-panel">
      
      {/* Three Forms section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form 1: Add new group */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2 mb-4">
            <FolderPlus size={16} className="text-indigo-600" />
            <span>Nieuwe Klas / Groep</span>
          </h4>
          
          <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Groepsnaam (bijv. BKN-F01)</label>
              <input 
                type="text" 
                value={newGroup.name} 
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Voorbeeld: BKN-F03"
                className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Assessoren (komma gescheiden)</label>
              <input 
                type="text" 
                value={newGroup.assessoren} 
                onChange={(e) => setNewGroup({ ...newGroup, assessoren: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Assessment Datum</label>
                <input 
                  type="date" 
                  value={newGroup.datum} 
                  onChange={(e) => setNewGroup({ ...newGroup, datum: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Slot Duur (minuten)</label>
                <select 
                  value={newGroup.slotDuration} 
                  onChange={(e) => setNewGroup({ ...newGroup, slotDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min (default)</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Starttijd</label>
                <input 
                  type="time" 
                  value={newGroup.startTime} 
                  onChange={(e) => setNewGroup({ ...newGroup, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Eindtijd</label>
                <input 
                  type="time" 
                  value={newGroup.endTime} 
                  onChange={(e) => setNewGroup({ ...newGroup, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
            >
              Voeg Groep Toe
            </button>
          </form>
        </div>

        {/* Form 2: Bulk teams to a group */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2 mb-4">
            <Plus size={16} className="text-indigo-600" />
            <span>Maak Teams in Bulk</span>
          </h4>

          <form onSubmit={handleCreateBulkTeams} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Voor welke Klas/Groep?</label>
              <select 
                value={selectedGroupForBulk}
                onChange={(e) => setSelectedGroupForBulk(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-semibold"
              >
                <option value="">-- Kies Groep --</option>
                {groepen.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Aantal aan te maken teams</label>
              <input 
                type="number" 
                value={bulkCount} 
                onChange={(e) => setBulkCount(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono font-semibold"
              />
            </div>

            <div className="bg-slate-50 border p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed">
              <strong>Tip:</strong> Hiermee genereert de app direct opeenvolgende teamkaarten (bijvoorbeeld Team 1, Team 2...) en roostert ze in op de beschikbare uren, waarbij de lunchpauze (12:00) keurig wordt overgeslagen.
            </div>

            <button 
              type="submit"
              disabled={!selectedGroupForBulk}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Genereer Teams Bulk
            </button>
          </form>
        </div>

        {/* Form 3: Add new student */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2 mb-4">
            <UserPlus size={16} className="text-indigo-600" />
            <span>Nieuwe Student</span>
          </h4>

          <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Studenten Naam</label>
              <input 
                type="text" 
                value={studentNameStr} 
                onChange={(e) => setStudentNameStr(e.target.value)}
                placeholder="Bijv. Baran, Sophie"
                className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Klas / Groep</label>
                <select 
                  value={selectedGroupForStudent}
                  onChange={(e) => {
                    setSelectedGroupForStudent(e.target.value);
                    setSelectedTeamForStudent("");
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-semibold"
                >
                  <option value="">-- Kies --</option>
                  {groepen.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Team Toewijzing</label>
                <select 
                  value={selectedTeamForStudent}
                  onChange={(e) => setSelectedTeamForStudent(e.target.value)}
                  disabled={!selectedGroupForStudent}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 disabled:opacity-50 font-semibold"
                >
                  <option value="">-- Kies team --</option>
                  {teamsInSelectedStudentGroup.map(t => (
                    <option key={t.id} value={t.id}>Team {t.teamNummer} ({t.slotTime || "Geen tijd"})</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!studentNameStr || !selectedGroupForStudent || !selectedTeamForStudent}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Voeg Student Toe
            </button>
          </form>
        </div>

      </div>

      {/* Lists Summary of current configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Geregistreerde Groepen & Deelnemers</h4>

        {groepen.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">Geen actieve klassen of groepen geconfigureerd. Registreer hierboven een klas of importeer CSV data.</p>
        ) : (
          <div className="space-y-4">
            {groepen.map((groep) => {
              const groupTeams = teams.filter(t => t.groepId === groep.id);
              
              return (
                <div key={groep.id} className="border border-slate-150 rounded-lg p-4 bg-slate-55/40 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{groep.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Datum: {groep.datum} | Tijd: {groep.startTime} - {groep.endTime} ({groep.slotDuration} min per slot)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Weet u zeker dat u klas "${groep.name}" wilt verwijderen? Dit wist ook alle teams, studenten en al opgeslagen assessment data!`)) {
                          onDeleteGroep(groep.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors focus:outline-none cursor-pointer"
                      title="Verwijder groep"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Team List with Students */}
                  {groupTeams.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Geen teams geregistreerd voor deze groep. Genereer hierboven een bulk of voeg handmatig toe.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupTeams.map((team) => {
                        const sList = studenten.filter(s => s.teamId === team.id && s.groepId === groep.id);

                        return (
                          <div key={team.id} className="bg-white border border-slate-200 rounded p-2.5 flex justify-between items-center text-xs">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800">Team {team.teamNummer}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">({team.slotTime || "Geen tijd"})</span>
                              
                              <div className="mt-1 flex flex-wrap gap-1">
                                {sList.map(s => (
                                  <span key={s.id} className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] max-w-[120px] truncate" title={s.name}>
                                    <span>{s.name}</span>
                                    <button 
                                      onClick={() => onDeleteStudent(s.id)}
                                      className="text-slate-400 hover:text-red-700 font-bold ml-1 text-[8px]"
                                      title="Verwijder student"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                                {sList.length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">Zonder studenten</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => onDeleteTeam(team.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors focus:outline-none"
                              title="Verwijder team"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
