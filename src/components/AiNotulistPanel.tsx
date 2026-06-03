import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Play, RefreshCw, AudioLines, Sparkles, Check, AlertCircle, Download } from "lucide-react";
import { LevelType, CRITERIA, LEVEL_SCORES, Criterium } from "../types";

// A simulation is built around whatever students are actually in the team,
// not hard-coded names. The teacher picks a score profile (pattern) and we
// synthesise a believable Dutch transcript + matching analysis on the client.
type SimPattern = "onvoldoende" | "random" | "uitstekend";

interface SimStudent {
  id: string;
  name: string;
}

interface SimDetection {
  criteriumId: number;
  studentName: string;
  level: LevelType;
  quote: string;
  reasoning: string;
}

interface BuiltSimulation {
  transcript: { timestamp: string; speaker: string; text: string }[];
  // Aligned 1:1 with transcript lines; null for examinator lines.
  detections: (SimDetection | null)[];
  analysis: {
    scores: Record<string, Record<number, number>>;
    tags: Record<string, Record<number, string[]>>;
    reasoning: Record<string, Record<number, string>>;
    feedback: Record<string, { strengths: string[]; improvements: string[] }>;
  };
}

// Random middle scenario stays in the "passing" band (Op/Boven/Excellent) so a
// solo run reads as a realistic "voldoende"; the dedicated button covers fails.
const PASSING_LEVELS: LevelType[] = ["Op", "Boven", "Excellent"];

function levelForPattern(pattern: SimPattern): LevelType {
  if (pattern === "onvoldoende") return "Onder";
  if (pattern === "uitstekend") return "Excellent";
  return PASSING_LEVELS[Math.floor(Math.random() * PASSING_LEVELS.length)];
}

function fmtTimestamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Phrase a student's spoken line for a criterium at a given level, grounded in
// the actual rubric tags from types.ts so the transcript matches the scoring.
function studentLine(crit: Criterium, level: LevelType): string {
  const tags = crit.tagsByLevel[level];
  const tag = (i: number) => (tags[i % tags.length] || "").toLowerCase();
  const topic = crit.title.toLowerCase();
  switch (level) {
    case "Onder":
      return `Eerlijk gezegd kreeg ik ${topic} niet goed voor elkaar. Het bleef bij ${tag(0)} en ${tag(1)}.`;
    case "Op":
      return `Ik heb ${topic} op basisniveau aangepakt: ${tag(0)}, met ${tag(1)}.`;
    case "Boven":
      return `Bij ${topic} liet ik duidelijk zien dat ik dit beheers: ${tag(0)} en ${tag(1)}.`;
    case "Excellent":
      return `Op ${topic} excelleerde ik echt: ${tag(0)}, ${tag(1)} én ${tag(2)}.`;
  }
}

function joinNames(names: string[]): string {
  if (names.length === 0) return "de student";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

// Build a complete, self-contained simulation (transcript + analysis) for the
// current team and chosen score profile. No server round-trip required.
function buildSimulation(students: SimStudent[], pattern: SimPattern): BuiltSimulation {
  const names = students.map(s => s.name);
  const transcript: BuiltSimulation["transcript"] = [];
  const detections: BuiltSimulation["detections"] = [];

  const scores: Record<string, Record<number, number>> = {};
  const tags: Record<string, Record<number, string[]>> = {};
  const reasoning: Record<string, Record<number, string>> = {};
  const feedback: Record<string, { strengths: string[]; improvements: string[] }> = {};
  students.forEach(s => { scores[s.name] = {}; tags[s.name] = {}; reasoning[s.name] = {}; });

  // Lock in one level per (student, criterium) up front so transcript and
  // analysis stay in sync (random is evaluated only once).
  const levelOf: Record<string, Record<number, LevelType>> = {};
  students.forEach(s => {
    levelOf[s.name] = {};
    CRITERIA.forEach(c => { levelOf[s.name][c.id] = levelForPattern(pattern); });
  });

  let t = 10;
  transcript.push({
    timestamp: fmtTimestamp(t),
    speaker: "Examinator",
    text: `Welkom ${joinNames(names)} bij jullie PROMEF Midterm Assessment. We lopen samen de zes criteria langs.`
  });
  detections.push(null);
  t += 20;

  CRITERIA.forEach(crit => {
    const question = students.length === 1
      ? `Criterium ${crit.id} — ${crit.title}. ${names[0]}, kun je toelichten hoe je hiermee bent omgegaan?`
      : `Criterium ${crit.id} — ${crit.title}. Kunnen jullie toelichten hoe je hiermee bent omgegaan?`;
    transcript.push({ timestamp: fmtTimestamp(t), speaker: "Examinator", text: question });
    detections.push(null);
    t += 15;

    students.forEach(s => {
      const level = levelOf[s.name][crit.id];
      const text = studentLine(crit, level);
      const lvlTags = crit.tagsByLevel[level];

      transcript.push({ timestamp: fmtTimestamp(t), speaker: s.name, text });
      detections.push({
        criteriumId: crit.id,
        studentName: s.name,
        level,
        quote: text.length > 90 ? text.slice(0, 90) + "…" : text,
        reasoning: `${s.name} laat op '${crit.title}' niveau ${level} zien (${lvlTags.slice(0, 2).join(", ")}).`
      });

      scores[s.name][crit.id] = LEVEL_SCORES[level];
      tags[s.name][crit.id] = lvlTags.slice(0, level === "Excellent" ? 3 : 2);
      reasoning[s.name][crit.id] = `${s.name} toont op '${crit.title}' het niveau ${level}: ${lvlTags.slice(0, 2).join(", ")}.`;
      t += 20;
    });
  });

  students.forEach(s => {
    const strengths: string[] = [];
    const improvements: string[] = [];
    CRITERIA.forEach(crit => {
      const level = levelOf[s.name][crit.id];
      if (level === "Boven" || level === "Excellent") {
        strengths.push(`${crit.title}: ${crit.tagsByLevel[level][0]}.`);
      } else {
        improvements.push(`${crit.title}: werk toe naar '${crit.tagsByLevel.Boven[0]}'.`);
      }
    });
    if (strengths.length === 0) strengths.push("Toont inzet en durft zich kwetsbaar op te stellen.");
    if (improvements.length === 0) improvements.push("Houd dit hoge niveau vast in het eindassessment.");
    feedback[s.name] = { strengths, improvements };
  });

  return { transcript, detections, analysis: { scores, tags, reasoning, feedback } };
}

interface AiNotulistPanelProps {
  students: SimStudent[]; // the actual team members the teacher is assessing
  onApplySuggestions: (
    scores: Record<string, Record<number, number>>,
    tags: Record<string, Record<number, string[]>>,
    notes: Record<string, Record<number, string>>,
    feedback: Record<string, { strengths: string[], improvements: string[] }>
  ) => void;
}

export default function AiNotulistPanel({
  students,
  onApplySuggestions
}: AiNotulistPanelProps) {
  // Normalise: drop blank names, fall back to a single placeholder so the panel
  // never renders empty. Derived names feed both simulation and audio paths.
  const studentList: SimStudent[] = students.filter(s => (s.name || "").trim()).length > 0
    ? students.filter(s => (s.name || "").trim())
    : [{ id: "s1", name: "Student A" }];
  const isSolo = studentList.length === 1;
  const displayNames = joinNames(studentList.map(s => s.name));
  // The audio-analysis server endpoint currently supports 1–2 students.
  const s1Name = studentList[0].name;
  const s2Name = studentList[1]?.name || "";
  // Mic recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeSimulationScenario, setActiveSimulationScenario] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  
  // Real-time transcript lines
  const [liveTranscript, setLiveTranscript] = useState<{ timestamp: string, speaker: string, text: string }[]>([]);
  const [incomingDetections, setIncomingDetections] = useState<{
    criteriumId: number;
    studentName: string;
    level: LevelType;
    quote: string;
    reasoning: string;
  }[]>([]);

  // Extracted report suggestions
  const [aiAnalysisResults, setAiAnalysisResults] = useState<{
    scores: Record<string, Record<number, number>>;
    tags: Record<string, Record<number, string[]>>;
    reasoning: Record<string, Record<number, string>>;
    feedback: Record<string, { strengths: string[], improvements: string[] }>;
  } | null>(null);

  // Clean-up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Download the current transcript as a plain .txt file
  const downloadTranscript = () => {
    if (liveTranscript.length === 0) return;

    const names = studentList.map(s => s.name);
    const header = `Discussie Transcript\nStudent${names.length > 1 ? "en" : ""}: ${names.join(" & ")}\nGeëxporteerd: ${new Date().toLocaleString("nl-NL")}\n${"=".repeat(40)}\n\n`;
    const body = liveTranscript
      .map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
      .join("\n\n");

    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const safeNames = names.join("-").replace(/[^a-z0-9-]/gi, "_");
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${safeNames}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Microphone capture setup
  const startRecording = async () => {
    try {
      setErrorStatus(null);
      setAiAnalysisResults(null);
      setLiveTranscript([]);
      setIncomingDetections([]);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleUploadAndAnalyze(audioBlob);
        
        // Stop all audio tracks from stream to release mic icon
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(1000); // chunk size 1s
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Fout bij toegang tot microfoon:", err);
      setErrorStatus(
        "Microfoontoegang geweigerd of mislukt. Zorg ervoor dat u microfoonrechten hebt toegekend."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // 2. File Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Accept audio file
    if (!file.type.startsWith("audio/")) {
      setErrorStatus("Alleen audiobestanden (.mp3, .wav, .m4a, .webm) zijn toegestaan.");
      return;
    }

    setAiAnalysisResults(null);
    setLiveTranscript([]);
    setIncomingDetections([]);
    await handleUploadAndAnalyze(file);
  };

  // Base64 helper
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Upload to NodeJS endpoint `/api/analyze-assessment`
  const handleUploadAndAnalyze = async (audioBlob: Blob) => {
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const base64Audio = await convertBlobToBase64(audioBlob);
      const res = await fetch("/api/analyze-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type || "audio/webm",
          student1Name: s1Name,
          student2Name: s2Name
        })
      });

      if (!res.ok) {
        throw new Error("Server reageerde met een fout bij het verwerken van de audio.");
      }

      const data = await res.json();
      if (data.success) {
        setLiveTranscript(data.transcript || []);
        setAiAnalysisResults(data.analysis);
        
        // Populate simulated/extracted detections
        generateDetectionsFromAnalysis(data.analysis, data.transcript || []);
      } else {
        throw new Error(data.error || "Onbekende fout van Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Er is een fout opgetreden bij het analyseren van het audiobestand.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to construct interactive inline competency detections
  const generateDetectionsFromAnalysis = (analysis: any, transcript: any[]) => {
    try {
      if (!analysis || !analysis.scores) {
        console.warn("No analysis or scores found in Gemini response", analysis);
        return;
      }
      const list: typeof incomingDetections = [];
      const scores = analysis.scores;

      // We can map student scores to actual criteria
      const studentNames = Object.keys(scores);
      
      studentNames.forEach((sName) => {
        const sScores = scores[sName];
        if (!sScores || typeof sScores !== "object") return;
        
        const sReasoning = analysis.reasoning?.[sName] || {};
        const sQuotes = analysis.quotes?.[sName] || {};

        Object.keys(sScores).forEach((critId) => {
          const cId = Number(critId);
          const criteriaObj = CRITERIA.find(c => c.id === cId);
          if (!criteriaObj) return;

          const val = (sScores as any)[critId] || (sScores as any)[cId];
          if (val === undefined || val === null) return;

          let lvl: LevelType = "Op";
          if (val === 1) lvl = "Onder";
          if (val === 2) lvl = "Op";
          if (val === 3) lvl = "Boven";
          if (val === 4) lvl = "Excellent";

          // Prefer the model's per-criterion quote; only fall back to a
          // transcript line if it is missing/empty.
          const modelQuote = ((sQuotes as any)[critId] || (sQuotes as any)[cId] || "").trim();
          let quote = modelQuote;
          if (!quote) {
            const studLines = transcript.filter(t => {
              if (!t || !t.speaker) return false;
              return t.speaker.toLowerCase() === sName.toLowerCase() ||
                     sName.toLowerCase().includes(t.speaker.toLowerCase()) ||
                     t.speaker.toLowerCase().includes(sName.toLowerCase());
            });
            // Vary the chosen line PER criterium so a missing model quote never
            // repeats the same line across all six cards.
            quote = studLines.length > 0
              ? studLines[(cId - 1) % studLines.length].text
              : "Demonstreert vaardigheden in overleg.";
          }

          list.push({
            criteriumId: cId,
            studentName: sName,
            level: lvl,
            quote: quote.slice(0, 100) + (quote.length > 100 ? "..." : ""),
            reasoning: (sReasoning as any)[critId] || (sReasoning as any)[cId] || "Criterium gedemonstreerd tijdens het gesprek."
          });
        });
      });

      setIncomingDetections(list);
    } catch (e) {
      console.error("Error in generateDetectionsFromAnalysis:", e);
    }
  };

  // 3. Simulation runner — fully client-side, driven by the CURRENT team's
  // students and a chosen score profile. Plays the generated transcript
  // line-by-line and streams the matching competency detections.
  const startSimulation = (pattern: SimPattern) => {
    setIsLoading(false);
    setErrorStatus(null);
    setAiAnalysisResults(null);
    setLiveTranscript([]);
    setIncomingDetections([]);
    setActiveSimulationScenario(pattern);
    setSimulationProgress(0);

    const built = buildSimulation(studentList, pattern);
    const totalLines = built.transcript.length;
    let currentIndex = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (currentIndex < totalLines) {
        const nextLine = built.transcript[currentIndex];
        const detection = built.detections[currentIndex];

        setLiveTranscript((prev) => [...prev, nextLine]);
        setSimulationProgress(Math.round(((currentIndex + 1) / totalLines) * 100));

        if (detection) {
          setIncomingDetections((prev) => [...prev, detection]);
        }

        currentIndex++;
      } else {
        // Finish and show the final report block ready to apply.
        if (timerRef.current) clearInterval(timerRef.current);
        setAiAnalysisResults(built.analysis);
        setActiveSimulationScenario(null);
      }
    }, 700);
  };

  // 4. Overwrite actual scores to local states!
  const handleApply = () => {
    if (!aiAnalysisResults) return;
    onApplySuggestions(
      aiAnalysisResults.scores,
      aiAnalysisResults.tags,
      aiAnalysisResults.reasoning,
      aiAnalysisResults.feedback
    );
    alert("AI kwalificaties, scores en beknopte feedback-notities zijn succesvol toegepast op het beoordelingsformulier!");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm" id="ai-notulist-container">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-600 animate-pulse" size={20} />
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">AI CO-PILOT</span>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">AI Notulist Co-Pilot</h4>
          </div>
        </div>
        
        {/* Live Mic Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm focus:outline-none uppercase tracking-wider cursor-pointer"
              id="btn-stop-rec"
            >
              <Square size={12} fill="white" />
              <span>Stop ({formatTime(recordingSeconds)})</span>
            </button>
          ) : (
            <button
              disabled={isLoading || activeSimulationScenario !== null}
              onClick={startRecording}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all disabled:opacity-50 focus:outline-none uppercase tracking-wider cursor-pointer shadow-sm"
              id="btn-start-rec"
              title="Luister live mee via uw microfoon"
            >
              <Mic size={10} />
              <span>Start Opname</span>
            </button>
          )}

          {/* Fallback audio file upload */}
          <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-3.5 py-2 rounded-xl flex items-center space-x-1 transition-all shadow-sm uppercase tracking-wider">
            <Upload size={10} />
            <span>Upload Audio</span>
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={isLoading || isRecording || activeSimulationScenario !== null}
            />
          </label>
        </div>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-100 text-red-000 rounded-2xl p-4 text-xs mb-4 flex items-start gap-2.5 shadow-sm animate-fade-in" id="ai-error-indicator">
          <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={15} />
          <span>{errorStatus}</span>
        </div>
      )}

      {/* Standard Simulated Assessment Options for Direct Play */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-4">
        <span className="text-[9px] font-extrabold text-indigo-805 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block">Snelle Discussie-Simulatie</span>
        <p className="text-[11px] text-slate-500 mt-2 mb-3">
          Simuleer direct een gesprek voor <span className="font-bold text-slate-700">{displayNames}</span> met een gekozen scoreprofiel:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {([
            { id: "onvoldoende" as SimPattern, label: "Alles onvoldoende", sub: "Elk criterium 'Onder'", accent: "border-l-red-400" },
            { id: "random" as SimPattern, label: isSolo ? "Voldoende (gemengd)" : "Random", sub: "Willekeurige slagende niveaus", accent: "border-l-amber-400" },
            { id: "uitstekend" as SimPattern, label: "Alles uitstekend", sub: "Elk criterium 'Excellent'", accent: "border-l-emerald-500" },
          ]).map((sc) => (
            <button
              key={sc.id}
              disabled={isLoading || isRecording || activeSimulationScenario !== null}
              onClick={() => startSimulation(sc.id)}
              className={`text-left p-3 hover:bg-slate-50 border border-slate-200 border-l-4 ${sc.accent} rounded-2xl transition-all cursor-pointer bg-white shadow-sm flex flex-col justify-between disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-extrabold text-slate-800 text-xs leading-tight">{displayNames}</div>
              <div className="text-[10px] font-bold text-slate-600 mt-1.5">{sc.label}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{sc.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Status Block during active recording or analysis */}
      {(isRecording || isLoading || activeSimulationScenario !== null) && (
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 mb-4 text-center shadow-sm animate-pulse">
          <div className="flex items-center justify-center space-x-2 text-indigo-700 text-xs font-semibold">
            <AudioLines className="animate-bounce" size={14} />
            <span className="uppercase tracking-wider text-[10px] font-bold">
              {isRecording ? "Scribe luistert mee op de achtergrond..." : 
               activeSimulationScenario ? `Discussie simulatie actief: ${simulationProgress}%` : 
               "Gemini analyseert discussiepatronen..."}
            </span>
          </div>
          {activeSimulationScenario && (
            <div className="w-full bg-slate-200/50 rounded-full h-1 mt-2">
              <div 
                className="bg-indigo-600 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${simulationProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Splitscreen dashboard for Transcription stream & Competency Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="ai-live-dashboard">
        
        {/* Column 1: Audio Transcript stream log */}
        <div className="bg-slate-55/40 bg-slate-50 border border-slate-250 rounded-2xl p-4 flex flex-col h-[320px]">
          <h5 className="text-[10px] font-extrabold text-slate-500 mb-2.5 border-b border-slate-200/50 pb-2.5 flex justify-between items-center uppercase tracking-wider">
            <span>DISCUSSIE TRANSCRIPT</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-medium text-slate-400">{liveTranscript.length} regels</span>
              {liveTranscript.length > 0 && (
                <button
                  onClick={downloadTranscript}
                  className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded-lg transition-all cursor-pointer uppercase tracking-wider normal-case"
                  id="btn-download-transcript"
                  title="Download het transcript als .txt-bestand"
                >
                  <Download size={11} />
                  <span>TXT</span>
                </button>
              )}
            </div>
          </h5>
          
          <div className="flex-1 overflow-y-auto space-y-3 font-sans pr-1 text-xs text-slate-700">
            {liveTranscript.map((line, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{line.timestamp}</span>
                  <span className="font-extrabold text-slate-800">{line.speaker}</span>
                </div>
                <p className="pl-1 text-slate-600 bg-white p-2 rounded-xl border border-slate-200">{line.text}</p>
              </div>
            ))}

            {liveTranscript.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <AudioLines size={24} className="text-slate-300" />
                <p className="text-[10px] mt-2 leading-relaxed max-w-xs font-medium">Start microfoon, sleep een audiobestand hiernaartoe, of trigger een simulatie om de live transcriptie te laten lopen.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Extracted Competency qualification feed */}
        <div className="bg-slate-55/40 bg-slate-50 border border-slate-250 rounded-2xl p-4 flex flex-col h-[320px]">
          <h5 className="text-[10px] font-extrabold text-slate-500 mb-2.5 border-b border-slate-200/50 pb-2.5 flex justify-between items-center uppercase tracking-wider">
            <span>DYNAMISCHE COMPETENTIE FEED</span>
            <span className="text-[9px] font-mono text-indigo-650 font-bold">{incomingDetections.length} matches</span>
          </h5>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {incomingDetections.map((det, index) => {
              const crit = CRITERIA.find(c => c.id === det.criteriumId);
              
              // Encode the level as a coloured left accent + inline label so it
              // never gets pushed out of view in the narrow feed column.
              let levelBorder = "border-l-slate-300";
              let levelText = "text-slate-600";
              if (det.level === "Onder") { levelBorder = "border-l-red-400"; levelText = "text-red-700"; }
              if (det.level === "Op") { levelBorder = "border-l-amber-400"; levelText = "text-amber-700"; }
              if (det.level === "Boven") { levelBorder = "border-l-emerald-400"; levelText = "text-emerald-700"; }
              if (det.level === "Excellent") { levelBorder = "border-l-indigo-500"; levelText = "text-indigo-700"; }

              return (
                <div key={index} className={`p-3 border border-slate-200/60 border-l-4 ${levelBorder} rounded-xl hover:shadow-sm bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="font-extrabold text-slate-800 truncate">{det.studentName}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${levelText}`}>· {det.level}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium block truncate">{crit?.title}</span>
                  </div>
                  <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic text-[10px] text-slate-500 font-medium">
                    "{det.quote}"
                  </div>
                  <p className="mt-1.5 text-[10px] text-indigo-700 font-bold">💡 {det.reasoning}</p>
                </div>
              );
            })}

            {incomingDetections.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Sparkles size={24} className="text-slate-300" />
                <p className="text-[10px] mt-2 leading-relaxed max-w-xs font-medium">AI analyseert de interactie om real-time scoring en observatie-tags te identificeren.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consolidated AI Recommendations Block (displays apply action) */}
      {aiAnalysisResults && (
        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-indigo-100/40 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in" id="ai-apply-card">
          <div className="flex-1 min-w-0">
            <h5 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} className="text-indigo-600" />
              <span>Gekwalificeerde scores & feedback gereed!</span>
            </h5>
            <p className="text-[11px] text-slate-650 mt-1 font-medium">
              De AI Scribe heeft scores, {Object.keys(aiAnalysisResults.tags).length} studentprofielen en gerichte feedbackrapport-suggesties geformuleerd.
            </p>
          </div>
          <button
            onClick={handleApply}
            className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer uppercase tracking-wider"
            id="apply-ai-suggestions-btn"
          >
            <Check size={14} />
            <span>Gebruik AI Suggesties</span>
          </button>
        </div>
      )}
    </div>
  );
}
