import React, { useState } from "react";
import { Plus } from "lucide-react";

interface AssessorenEditorProps {
  assessoren: string[];
  onChange: (next: string[]) => void;
}

export default function AssessorenEditor({ assessoren, onChange }: AssessorenEditorProps) {
  const [draft, setDraft] = useState("");

  const addAssessor = () => {
    const name = draft.trim();
    if (!name) return;
    const exists = assessoren.some(a => a.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...assessoren, name]);
    setDraft("");
  };

  const removeAssessor = (name: string) => {
    onChange(assessoren.filter(a => a !== name));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assessoren.length === 0 && (
        <span className="text-[10px] text-slate-400 italic">Nog geen assessoren</span>
      )}
      {assessoren.map(name => (
        <span
          key={name}
          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        >
          <span>{name}</span>
          <button
            type="button"
            onClick={() => removeAssessor(name)}
            className="text-indigo-400 hover:text-red-600 font-bold leading-none"
            aria-label={`Verwijder ${name}`}
            title={`Verwijder ${name}`}
          >
            ✕
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAssessor();
            }
          }}
          placeholder="Docent toevoegen"
          className="px-2 py-0.5 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-[11px] w-32"
        />
        <button
          type="button"
          onClick={addAssessor}
          className="text-indigo-600 hover:text-indigo-800"
          aria-label="Voeg assessor toe"
          title="Voeg assessor toe"
        >
          <Plus size={14} />
        </button>
      </span>
    </div>
  );
}
