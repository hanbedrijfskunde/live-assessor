import React, { useRef, useState } from "react";
import { parseCSV, downloadBackup } from "../utils";
import { Groep, Team, Student, TeamAssessment } from "../types";
import { Download, Upload, AlertCircle, RefreshCw, FileText, Database, Trash2 } from "lucide-react";

interface DataManagerProps {
  groepen: Groep[];
  teams: Team[];
  studenten: Student[];
  assessments: Record<string, TeamAssessment>;
  onImportData: (groups: Groep[], teams: Team[], students: Student[]) => void;
  onRestoreBackup: (backupData: any) => void;
  onLoadExampleData: () => Promise<void>;
  onResetAllData: () => void;
}

export default function DataManager({
  groepen,
  teams,
  studenten,
  assessments,
  onImportData,
  onRestoreBackup,
  onLoadExampleData,
  onResetAllData
}: DataManagerProps) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV Import handler
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setErrorMessage(null);
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.groups.length === 0) {
          throw new Error("Geen geldige groeps- of studentenregels gevonden in het bestand.");
        }

        onImportData(parsed.groups, parsed.teams, parsed.students);
        alert(`Succesvol ${parsed.students.length} studenten verdeeld over ${parsed.teams.length} teams en ${parsed.groups.length} klassen geïmporteerd!`);
        
        // Reset file input value
        if (csvInputRef.current) csvInputRef.current.value = "";
      } catch (err: any) {
        console.error("Fout bij importeren CSV:", err);
        setErrorMessage(err.message || "Fout bij inlezen van CSV. Controleer het bestandsformaat.");
      }
    };
    reader.readAsText(file);
  };

  // JSON Restore backup handler
  const handleJSONRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setErrorMessage(null);
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data.groepen || !data.teams || !data.studenten || !data.assessments) {
          throw new Error("Ongeldig back-up bestand. De benodigde properties 'groepen', 'teams', 'studenten' of 'assessments' ontbreken.");
        }

        onRestoreBackup(data);
        alert("Volledige database back-up is succesvol hersteld!");
        if (jsonInputRef.current) jsonInputRef.current.value = "";
      } catch (err: any) {
        console.error("Fout bij inlezen JSON backup:", err);
        setErrorMessage(err.message || "Fout bij de-serialisatie van de JSON back-up.");
      }
    };
    reader.readAsText(file);
  };

  // Full export schema
  const handleExportBackup = () => {
    const bundle = {
      groepen,
      teams,
      studenten,
      assessments
    };
    downloadBackup(bundle, `PROMEF_Backup_${new Date().toISOString().split("T")[0]}.json`);
  };

  return (
    <div className="space-y-6" id="databeheer-workspace">
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex items-start gap-2" id="data-error-banner">
          <AlertCircle className="shrink-0 mt-0.5 text-red-650" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: CSV Import participating participants */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <FileText size={16} className="text-indigo-600" />
            <span>CSV Deelnemers Import</span>
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Wissel snel van cohort door een studentenlijst te importeren vanaf Excel of CSV. Groepen en teams worden automatisch geparseerd. Nederlandse Excel-puntkomma's (;) en komma's (,) worden automatisch gedetecteerd.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] text-slate-650 font-mono scale-95 origin-left">
            <div><strong>Bestandsopbouw vereisten (Kolomkoppen):</strong></div>
            <div className="mt-1 text-slate-500">Student | Groep | Team</div>
            <div className="text-slate-400">Voornaam; BKN-F01; 1</div>
            <div className="text-slate-400">Voornaam; BKN-F01; 1</div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => csvInputRef.current?.click()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 focus:outline-none cursor-pointer"
            >
              <Upload size={14} />
              <span>Selecteer & Importeer CSV</span>
            </button>
            <input
              type="file"
              ref={csvInputRef}
              accept=".csv,.txt"
              onChange={handleCSVImport}
              className="hidden"
            />
          </div>
        </div>

        {/* Box 2: JSON Backup Restore database */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <Database size={16} className="text-indigo-600" />
            <span>JSON Backup & Herstel</span>
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exporteer de volledige applicatie-database (inclusief tot nu toe geregistreerde cijfers en feedbacknotulen) naar een JSON-bestand voor beveiliging, archivering of overdracht naar een andere computer.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              onClick={handleExportBackup}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1 focus:outline-none cursor-pointer"
            >
              <Download size={13} />
              <span>Maak Back-up</span>
            </button>

            <button
              onClick={() => jsonInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-750 border border-slate-200 font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1 focus:outline-none cursor-pointer"
            >
              <Upload size={13} />
              <span>Herstel Back-up</span>
            </button>
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              onChange={handleJSONRestore}
              className="hidden"
            />
          </div>
        </div>

      </div>

      {/* Box 3: Master administrative clean commands */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Administratieve Acties</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-indigo-100 rounded-lg p-3.5 bg-indigo-50/50 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-indigo-900 text-xs">Voorbeelddata Inladen</h5>
              <p className="text-[11px] text-slate-550 mt-1">
                Laad de standaard democohorten van de HAN bedrijfskunde uit <code>demo.csv</code> (alleen de namenlijst — nog niet beoordeeld) om de kalender, het scoreformulier en de import-flow direct uit te proberen.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await onLoadExampleData();
                  alert("Standaard Bedrijfskunde voorbeelddata is succesvol geladen!");
                } catch (err) {
                  alert(`Kon de voorbeelddata niet laden: ${err instanceof Error ? err.message : err}`);
                }
              }}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 px-3 rounded transition-colors self-start cursor-pointer"
            >
              Laad Voorbeeldset
            </button>
          </div>

          <div className="border border-red-100 rounded-lg p-3.5 bg-red-50/20 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-red-900 text-xs">Volledige Database Wissen</h5>
              <p className="text-[11px] text-slate-550 mt-1">
                Wis alle opgeslagen groepen, studenten, en geëvalueerde assessment rapporten permanent uit uw browsercache (localStorage). <strong>Let op: deze actie kan niet ongedaan worden gemaakt!</strong>
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm("Weet u absoluut zeker dat u ALLE groepen, studenten en cijfers wilt wissen uit de browser? Dit is onomkeerbaar.")) {
                  onResetAllData();
                  alert("Alle gegevens zijn succesvol gewist. De app start nu leeg op.");
                }
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-1.5 px-3 rounded transition-colors self-start cursor-pointer flex items-center space-x-1"
            >
              <Trash2 size={13} />
              <span>Volledige Reset</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
