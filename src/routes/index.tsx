import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Trophy, Brain, Users, ChevronRight, Activity, Map,
  ScrollText, RefreshCcw, Star, Target, Medal,
  PlusCircle, ArrowLeft, Undo2, X, AlertTriangle,
  ArrowRightCircle, Settings2, Play, CheckCircle, Info, Timer as Clock,
  ArrowUpCircle, AlertCircle, MinusCircle, Lightbulb, History,
  ArrowDownNarrowWide, Layout, Calendar, Users2,
  TrendingUp, Rocket, Wand2, TimerIcon, BrainCircuit,
  UserCheck, Eye, ClipboardCheck, ArrowLeftCircle,
  CheckCircle2, Search, Home, List,
} from "lucide-react";
import {
  CLASSES_CONFIG, CURRICULUM, MAX_LEVEL, STAGNATION_REASONS,
  calculateLevelFromStars, generateClassStudents, type Cycle, type Student,
} from "@/lib/curriculum";
import { OdysseyMap } from "@/components/OdysseyMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stadium Quest — Pilotage EPS Badminton" },
      { name: "description", content: "Plateforme gamifiée de pilotage EPS badminton : registre, parcours odyssée, labo live, architecte de séquence." },
    ],
  }),
  component: AppWrapper,
});

// --- ICON RENDERER ---
const IconRenderer = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Activity, Brain, Users, Trophy, Medal, Star, Target, CheckCircle2, ArrowRightCircle, Settings2, Play, CheckCircle, Info, Clock, ArrowUpCircle, AlertCircle, MinusCircle, Lightbulb, History, ArrowDownNarrowWide, Layout, Calendar, Users2, TrendingUp, Rocket, Wand2, TimerIcon, BrainCircuit, UserCheck, Eye, ClipboardCheck, ArrowLeftCircle, Home, Map, List, Search, ChevronRight, X, ArrowLeft, Undo2, AlertTriangle, PlusCircle, ScrollText, RefreshCcw,
  };
  const IconComponent = icons[name] || Activity;
  return <IconComponent size={size} className={className} />;
};

// --- RADAR ---
const FullSpectrumRadar = ({ skillStates, cycle, size = 300 }: { skillStates: Record<string, number>; cycle: Cycle; size?: number }) => {
  const currentTree = CURRICULUM[cycle]?.categories;
  if (!currentTree) return null;
  const allSkills: Array<{ id: string; code: string; categoryColor: string }> = [];
  Object.entries(currentTree).forEach(([, cat]) => { cat.skills.forEach(s => { allSkills.push({ ...s, categoryColor: cat.color }); }); });
  const angleStep = (Math.PI * 2) / allSkills.length;
  const center = size / 2;
  const radius = center - 50;
  const points = allSkills.map((s, i) => {
    const stars = skillStates[s.id] || 0;
    const scale = stars / 5;
    const angle = i * angleStep - Math.PI / 2;
    return { x: center + radius * scale * Math.cos(angle), y: center + radius * scale * Math.sin(angle), labelX: center + (radius + 25) * Math.cos(angle), labelY: center + (radius + 25) * Math.sin(angle), color: s.categoryColor, code: s.code };
  });
  const d = points.length > 0 ? `M ${points[0].x} ${points[0].y} ${points.map(p => `L ${p.x} ${p.y}`).join(" ")} Z` : "";
  return (
    <div className="relative flex items-center justify-center font-bold italic">
      <svg width={size} height={size} className="overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
          <polygon key={r} points={allSkills.map((_, i) => { const angle = i * angleStep - Math.PI / 2; return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`; }).join(" ")} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {allSkills.map((_, i) => { const angle = i * angleStep - Math.PI / 2; return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />; })}
        {d && <path d={d} fill="rgba(250, 204, 21, 0.2)" stroke="#fbbf24" strokeWidth={3} className="transition-all duration-1000" />}
        {points.map((p, i) => (
          <g key={i}><circle cx={p.x} cy={p.y} r={4} fill="white" /><text x={p.labelX} y={p.labelY} fill={p.color} fontSize={10} fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="uppercase">{p.code}</text></g>
        ))}
      </svg>
    </div>
  );
};

// --- LEVEL UP OVERLAY ---
const LevelUpAnimation = ({ oldLevel, newLevel, studentName, onComplete }: { oldLevel: number; newLevel: number; studentName: string; onComplete: () => void }) => {
  useEffect(() => { const t = setTimeout(onComplete, 3500); return () => clearTimeout(t); }, [onComplete]);
  return (
    <div onClick={onComplete} className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/95 backdrop-blur-3xl cursor-pointer select-none font-bold italic">
      <div className="text-center relative">
        <div className="flex flex-col items-center gap-10">
          <div className="p-10 bg-yellow-400 rounded-full border-[12px] border-black shadow-[0_0_150px_rgba(250,204,21,0.5)] animate-bounce"><IconRenderer name="Medal" size={120} className="text-black" /></div>
          <div className="space-y-6 text-center">
            <h2 className="text-5xl text-sky-400 uppercase tracking-[0.3em] animate-pulse">ÉVOLUTION !</h2>
            <h1 className="text-8xl text-white uppercase tracking-tighter drop-shadow-2xl">{studentName}</h1>
            <div className="flex items-center justify-center gap-12 mt-16">
              <div className="flex flex-col items-center"><span className="text-gray-500 text-sm uppercase">ANCIEN</span><span className="text-5xl text-gray-500">N{oldLevel}</span></div>
              <IconRenderer name="ChevronRight" size={64} className="text-yellow-400 animate-pulse" />
              <div className="flex flex-col items-center"><span className="text-yellow-400 text-sm uppercase">NOUVEAU</span><span className="text-8xl text-white drop-shadow-[0_0_30px_#fbbf24]">N{newLevel}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error("Erreur capturée :", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 font-sans font-bold italic">
          <div className="bg-red-500/10 border-4 border-red-500 p-10 rounded-3xl max-w-lg text-center space-y-6 shadow-2xl">
            <AlertTriangle size={64} className="text-red-500 mx-auto animate-bounce" />
            <h2 className="text-3xl text-red-500 uppercase tracking-widest">Erreur Système</h2>
            <p className="text-gray-400 text-sm">L'interface a rencontré un problème. Vos données sont préservées.</p>
            <button onClick={() => window.location.reload()} className="w-full px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl uppercase tracking-widest">Recharger</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MAIN APP ---
const AppContent = () => {
  const [view, setView] = useState<"hub" | "dashboard" | "profile">("hub");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<Record<string, Student[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dashboardMode, setDashboardMode] = useState<"classic" | "odyssey" | "situations" | "architect">("classic");
  const [notif, setNotif] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ name: string; old: number; new: number } | null>(null);

  const [situationFlow, setSituationFlow] = useState<"config" | "live" | "report">("config");
  const [selectedSkillsForSituation, setSelectedSkillsForSituation] = useState<string[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<Array<{ studentId: string; skillId: string; oldPalier: number; newPalier: number }>>([]);
  const [stagnationFeedback, setStagnationFeedback] = useState<Record<string, string>>({});

  const [sequenceInputs, setSequenceInputs] = useState({
    numLessons: 8,
    practiceTime: 60,
    girls: 15,
    boys: 15,
    specialNeeds: { pai: 0, pap: 0, segpa: 0, handicap: 0 } as Record<string, number>,
    badmintonExp: 1,
  });
  type SequenceBlock = { label: string; time: number; color: string; title: string; content: string; goals: string; criteria: string; schema: string };
  type GeneratedSequence = {
    trame: Array<{ id: string; code: string; name: string; foci: boolean[] }>;
    planning: Array<{ lesson: number; blocks: SequenceBlock[] }>;
  };
  const [generatedSequence, setGeneratedSequence] = useState<GeneratedSequence | null>(null);
  const [selectedSituationDetail, setSelectedSituationDetail] = useState<SequenceBlock | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "level" | "difficulty">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [genderFilter] = useState<"All" | "F" | "M">("All");

  const profileContainerRef = useRef<HTMLDivElement>(null);

  const currentClass = useMemo(() => CLASSES_CONFIG.find(c => c.id === selectedClassId), [selectedClassId]);
  const currentStudents = useMemo(() => (selectedClassId && studentsData[selectedClassId]) || [], [studentsData, selectedClassId]);
  const student = useMemo(() => currentStudents.find(s => s.id === selectedId), [currentStudents, selectedId]);

  const allSkillsFlat = useMemo(() => {
    if (!currentClass) return [];
    return Object.values(CURRICULUM[currentClass.cycle].categories).flatMap(c => c.skills);
  }, [currentClass]);

  useEffect(() => {
    if (selectedClassId && !studentsData[selectedClassId]) {
      setStudentsData(prev => ({ ...prev, [selectedClassId]: generateClassStudents(selectedClassId) }));
    }
  }, [selectedClassId, studentsData]);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const handleAiGeneration = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const isCycle3 = currentClass?.cycle === "cycle3";
      setGeneratedSequence({
        trame: allSkillsFlat.map(sk => ({
          ...sk,
          foci: Array.from({ length: sequenceInputs.numLessons }, (_, i) => {
            const lessonIdx = i + 1;
            const expShift = (sequenceInputs.badmintonExp - 1) * 2;
            const actualIdx = lessonIdx + expShift;
            if (sk.code === "a" || sk.code === "b") return actualIdx <= 4 || actualIdx % 3 === 0;
            if (sk.code === "f" || sk.code === "g") return actualIdx >= 3;
            if (sk.id.includes("smash") || sk.code === "d") return actualIdx >= 5;
            return false;
          }),
        })),
        planning: Array.from({ length: sequenceInputs.numLessons }, (_, i) => ({
          lesson: i + 1,
          blocks: [
            { label: "Mise en train (15')", time: 15, color: "bg-gray-800", title: "Routine de Maniabilité",
              content: "Mise en action cardio-pulmonaire progressive. Travail de maniabilité raquette : ateliers de jongles variés et changements de prises. Suivi d'une routine de shadow-badminton.",
              goals: "Élever le rythme cardiaque tout en développant la proprioception.", criteria: "Maintien de 10 échanges continus en jonglant. Réalisation de 5 fentes équilibrées.", schema: "JONGLES" },
            { label: "Apprentissage (30')", time: 30, color: "bg-sky-600",
              title: isCycle3 ? "Le Golf-minton (Précision)" : "Cibler les Zones de Divorce",
              content: isCycle3 ? "Servir précisément dans des cibles au sol placées à différentes distances." : "Marquer dans les espaces situés entre les deux joueurs ou dans les zones latérales extrêmes.",
              goals: isCycle3 ? "Maîtriser la direction et la force de sa frappe." : "Sortir du jeu centré sur soi pour prendre l'information.",
              criteria: isCycle3 ? "Atteindre 3 fois de suite la cible." : "Provoquer au moins 2 déséquilibres adverses par 5 minutes.", schema: "TACTIC" },
            { label: "Référence (25')", time: 25, color: "bg-emerald-600", title: "Match à Thème : Montée-Descente",
              content: "Tournoi format Montée-descente. Matchs au temps (4 minutes).",
              goals: "Mettre en œuvre les compétences acquises sous pression.", criteria: "Gagner au moins la moitié de ses duels.", schema: "MATCH_REAL" },
          ],
        })),
      });
      setIsAiGenerating(false);
      notify("Séquence didactique générée !");
    }, 2000);
  };

  const updateStudentSkill = (studId: string, skillId: string, direction: "up" | "down" = "up", silent = false) => {
    if (!selectedClassId || !currentClass) return;
    setStudentsData(prev => {
      const classStuds = [...(prev[selectedClassId] || [])];
      const idx = classStuds.findIndex(s => s.id === studId);
      if (idx === -1) return prev;
      const s = { ...classStuds[idx] };
      const curStars = s.skillStates[skillId] || 0;
      if (direction === "up" && curStars >= 5) return prev;
      if (direction === "down" && curStars <= 0) return prev;
      const oldLevel = s.level;
      const nextStars = direction === "up" ? curStars + 1 : curStars - 1;
      const nextSkillStates = { ...s.skillStates };
      if (nextStars === 0) delete nextSkillStates[skillId]; else nextSkillStates[skillId] = nextStars;
      const newLevel = calculateLevelFromStars(nextSkillStates, currentClass.cycle);
      if (situationFlow === "live" && direction === "up") {
        setSessionLogs(logs => [...logs, { studentId: studId, skillId, oldPalier: curStars, newPalier: nextStars }]);
      }
      s.skillStates = nextSkillStates;
      s.level = newLevel;
      if (newLevel > oldLevel && situationFlow !== "live") {
        setLevelUpData({ name: s.name, old: oldLevel, new: newLevel });
      }
      classStuds[idx] = s;
      return { ...prev, [selectedClassId]: classStuds };
    });
    if (!silent) notify(direction === "up" ? "Palier validé !" : "Correction effectuée.");
  };

  const archiveSituation = () => {
    if (!selectedClassId) return;
    setStudentsData(prev => {
      const classStuds = [...(prev[selectedClassId] || [])];
      currentStudents.forEach((s, sIdx) => {
        selectedSkillsForSituation.forEach(skId => {
          if (!sessionLogs.some(log => log.studentId === s.id && log.skillId === skId)) {
            const feedbackKey = `${s.id}-${skId}`;
            const reasonLabel = stagnationFeedback[feedbackKey] || "Non renseigné";
            const reasonObj = STAGNATION_REASONS.find(r => r.label === reasonLabel);
            const updatedStudent = { ...classStuds[sIdx] };
            updatedStudent.stagnations = [
              ...(updatedStudent.stagnations || []),
              { skillId: skId, skillName: allSkillsFlat.find(sk => sk.id === skId)?.name, palierCible: (s.skillStates[skId] || 0) + 1, reason: reasonLabel, remediation: reasonObj?.remediation, date: new Date().toLocaleDateString("fr-FR") },
            ];
            classStuds[sIdx] = updatedStudent;
          }
        });
      });
      return { ...prev, [selectedClassId]: classStuds };
    });
    setSituationFlow("config"); setDashboardMode("classic"); setSessionLogs([]); setSelectedSkillsForSituation([]); setStagnationFeedback({});
    notify("Session archivée !");
  };

  const filteredStudentsList = useMemo(() => {
    const result = [...currentStudents]
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(s => genderFilter === "All" || s.gender === genderFilter);
    result.sort((a, b) => {
      if (sortKey === "difficulty") return (b.stagnations?.length || 0) - (a.stagnations?.length || 0);
      let vA: string | number = a[sortKey], vB: string | number = b[sortKey];
      if (typeof vA === "string") { vA = (vA as string).toLowerCase(); vB = (vB as string).toLowerCase(); }
      return sortOrder === "asc" ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });
    return result;
  }, [currentStudents, searchTerm, genderFilter, sortKey, sortOrder]);

  // --- HUB ---
  if (view === "hub") {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-8 md:p-12 overflow-y-auto italic font-bold text-center">
        <header className="max-w-6xl mx-auto mb-16">
          <div className="inline-flex p-6 rounded-[3rem] bg-yellow-400 border-4 border-black mb-8 shadow-2xl animate-bounce"><IconRenderer name="Trophy" size={64} className="text-black" /></div>
          <h1 className="text-7xl font-black uppercase tracking-tighter drop-shadow-lg">STADIUM <span className="text-yellow-400">QUEST</span></h1>
          <p className="text-sky-400 uppercase tracking-widest text-xs mt-4">Plateforme de Pilotage EPS v.2026</p>
        </header>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {CLASSES_CONFIG.map(cls => (
            <div key={cls.id} onClick={() => { setSelectedClassId(cls.id); setView("dashboard"); setDashboardMode("classic"); }} className="group bg-[#1e293b] border-4 border-gray-800 rounded-[2.5rem] p-10 cursor-pointer hover:border-yellow-400 transition-all hover:scale-105 shadow-2xl text-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-blue-600 border-4 border-black flex items-center justify-center mb-8 shadow-xl group-hover:bg-yellow-400 group-hover:text-black transition-colors"><span className="text-4xl font-black">{cls.id}</span></div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">{cls.name}</h3>
                <div className="px-4 py-1 rounded-lg bg-black/40 text-[10px] text-sky-400 uppercase">{cls.cycle === "cycle3" ? "Cycle 3" : "Cycle 4"}</div>
                <div className="mt-10 pt-8 border-t border-white/5 w-full flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest">
                  <span>{studentsData[cls.id]?.length || 0} JOUEURS</span>
                  <IconRenderer name="ChevronRight" size={20} className="text-yellow-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden font-sans italic font-bold text-left">
      {levelUpData && <LevelUpAnimation oldLevel={levelUpData.old} newLevel={levelUpData.new} studentName={levelUpData.name} onComplete={() => setLevelUpData(null)} />}

      <header className="p-4 px-8 bg-[#1e293b]/90 backdrop-blur-3xl border-b-4 border-gray-800 z-[1000] flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
          <button onClick={() => { setView("hub"); setSelectedSituationDetail(null); }} className="p-4 rounded-2xl bg-black border-2 border-gray-700 hover:border-yellow-400 transition-all text-white active:scale-90"><IconRenderer name="Home" size={22} /></button>
          <div className="h-10 w-1 bg-gray-700 rounded-full" />
          <div><h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><span className="text-yellow-400">{currentClass?.id}</span> {currentClass?.name}</h1><span className="text-[10px] text-sky-400 uppercase tracking-widest">Saison Stadium 2026</span></div>
        </div>
        <div className="bg-black/50 p-2 rounded-3xl border-2 border-gray-700 flex gap-2">
          {[
            { id: "classic", icon: "List", label: "Registre" },
            { id: "odyssey", icon: "Map", label: "Parcours" },
            { id: "situations", icon: "Settings2", label: "Labo Live" },
            { id: "architect", icon: "Layout", label: "Architecte" },
          ].map(m => (
            <button key={m.id} onClick={() => { setView("dashboard"); setDashboardMode(m.id as typeof dashboardMode); setSelectedSituationDetail(null); }} className={`px-6 py-2.5 rounded-2xl text-[11px] uppercase transition-all flex items-center gap-2 ${dashboardMode === m.id && view === "dashboard" ? "bg-yellow-400 text-black shadow-lg scale-105" : "text-gray-500 hover:text-white"}`}>
              <IconRenderer name={m.icon} size={16} />
              <span className="hidden lg:inline">{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => { setView("dashboard"); setDashboardMode("situations"); setSituationFlow("config"); setSelectedSituationDetail(null); }} className="bg-emerald-600 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-2xl text-[11px] uppercase border-4 border-black flex items-center gap-2 shadow-xl active:scale-95"><IconRenderer name="Play" size={16} /> Session</button>
      </header>

      {notif && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-emerald-500 text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border-4 border-black shadow-2xl">{notif}</div>}

      <div className="flex-1 relative overflow-hidden">
        {/* REGISTRE */}
        {dashboardMode === "classic" && view !== "profile" && (
          <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-wrap items-center gap-4 bg-[#1e293b] p-4 rounded-[2rem] border-4 border-gray-800 shadow-2xl">
                <div className="relative flex-1 min-w-[200px]">
                  <IconRenderer name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
                  <input type="text" placeholder="TROUVER ÉLÈVE..." className="w-full bg-black/60 border-2 border-gray-700 rounded-xl py-3 pl-12 pr-4 text-xs uppercase outline-none focus:border-yellow-400 transition-all text-white placeholder-gray-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border-2 border-gray-700 gap-1">
                  <button onClick={() => setSortKey("name")} className={`px-4 py-2 rounded-lg text-[10px] uppercase ${sortKey === "name" ? "bg-sky-600 text-white" : "text-gray-500"}`}>A-Z</button>
                  <button onClick={() => setSortKey("level")} className={`px-4 py-2 rounded-lg text-[10px] uppercase ${sortKey === "level" ? "bg-sky-600 text-white" : "text-gray-500"}`}>Note</button>
                  <button onClick={() => setSortKey("difficulty")} className={`px-4 py-2 rounded-lg text-[10px] uppercase flex items-center gap-2 ${sortKey === "difficulty" ? "bg-red-600 text-white" : "text-gray-500"}`}><IconRenderer name="AlertCircle" size={12} /> Alertes</button>
                </div>
                <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-3 bg-white/5 border-2 border-white/10 rounded-xl hover:bg-white/10"><IconRenderer name="ArrowDownNarrowWide" size={18} className={sortOrder === "desc" ? "rotate-180 transition-transform" : ""} /></button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                {filteredStudentsList.map(s => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setView("profile"); }} className="group relative bg-[#1e293b] border-2 border-gray-800 rounded-2xl p-3 cursor-pointer hover:border-sky-400 transition-all text-center shadow-xl hover:-translate-y-1">
                    <div className="absolute -top-2 -right-2 flex flex-col gap-1 z-20">
                      {(s.stagnations || []).slice(-3).map((st, idx) => {
                        const cat = currentClass ? CURRICULUM[currentClass.cycle].categories : {};
                        const dim = Object.keys(cat).find(c => cat[c].skills.some(sk => sk.id === st.skillId));
                        const color = (dim && cat[dim]?.color) || "#f87171";
                        return (
                          <div key={idx} style={{ backgroundColor: color }} className={`w-8 h-8 rounded-full border-2 border-black flex flex-col items-center justify-center text-white shadow-lg ${st.reason === "Non renseigné" ? "animate-pulse ring-2 ring-white/50" : ""}`}>
                            <span className="text-[6px] leading-none">P{st.palierCible}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-10 h-10 mx-auto rounded-xl bg-black border-2 border-gray-700 flex items-center justify-center group-hover:border-yellow-400 transition-all font-black text-white text-lg">{s.name[0]}</div>
                    <div className="text-[9px] uppercase truncate mt-2 text-gray-400">{s.name}</div>
                    <div className="text-[10px] text-sky-400 mt-1">{s.level}/24</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PARCOURS ODYSSÉE — REDESIGNÉ */}
        {dashboardMode === "odyssey" && view !== "profile" && (
          <OdysseyMap
            students={currentStudents}
            onSelectStudent={(id) => { setSelectedId(id); setView("profile"); }}
          />
        )}

        {/* ARCHITECTE */}
        {dashboardMode === "architect" && view !== "profile" && !selectedSituationDetail && (
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar h-full bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-sky-500/10 rounded-[3rem] border-4 border-sky-500 flex items-center justify-center mx-auto text-sky-500"><IconRenderer name="TrendingUp" size={48} /></div>
                <h2 className="text-6xl font-black uppercase tracking-tighter text-white">Architecte <span className="text-yellow-400">Séquence</span></h2>
                <p className="text-gray-500 uppercase tracking-widest text-xs">Diagnostic d'Inclusion & Ingénierie Didactique</p>
              </div>
              {!generatedSequence ? (
                <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[4rem] p-12 shadow-3xl max-w-5xl mx-auto space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h3 className="text-xl uppercase text-sky-400 flex items-center gap-3"><Clock /> Volume & Culture</h3>
                      <div className="p-8 bg-black/40 rounded-3xl border-2 border-gray-800 space-y-8">
                        <div><label className="text-[10px] text-gray-500 uppercase block mb-4">Leçons du Cycle (6-12)</label><input type="range" min="6" max="12" value={sequenceInputs.numLessons} onChange={e => setSequenceInputs({ ...sequenceInputs, numLessons: parseInt(e.target.value) })} className="w-full h-2 bg-gray-800 rounded-lg accent-yellow-400" /><div className="text-3xl font-black text-white mt-4">{sequenceInputs.numLessons} leçons</div></div>
                        <div><label className="text-[10px] text-gray-500 uppercase block mb-3">Pratique Motrice (min)</label><input type="number" step="5" min="20" max="120" value={sequenceInputs.practiceTime} onChange={e => setSequenceInputs({ ...sequenceInputs, practiceTime: parseInt(e.target.value) })} className="w-full bg-black border-2 border-gray-700 rounded-xl p-4 text-white" /></div>
                        <div><label className="text-[10px] text-gray-500 uppercase block mb-3">Niveau d'Expérience</label><div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(v => (<button key={v} onClick={() => setSequenceInputs({ ...sequenceInputs, badmintonExp: v })} className={`p-5 rounded-xl border-2 text-[11px] ${sequenceInputs.badmintonExp === v ? "bg-yellow-400 text-black border-black" : "bg-black text-gray-500 border-gray-800"}`}>SÉQUENCE {v}</button>))}</div></div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xl uppercase text-emerald-400 flex items-center gap-3"><Users2 /> Profil de Classe</h3>
                      <div className="p-8 bg-black/40 rounded-3xl border-2 border-gray-800 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div><label className="text-[10px] text-gray-500 uppercase block mb-2">Filles</label><div className="flex items-center gap-3 bg-[#1e293b] p-3 rounded-xl border border-gray-700"><button onClick={() => setSequenceInputs({ ...sequenceInputs, girls: Math.max(0, sequenceInputs.girls - 1) })} className="text-red-400 p-1"><MinusCircle size={16} /></button><span className="text-xl font-black text-white flex-1 text-center">{sequenceInputs.girls}</span><button onClick={() => setSequenceInputs({ ...sequenceInputs, girls: sequenceInputs.girls + 1 })} className="text-emerald-400 p-1"><PlusCircle size={16} /></button></div></div>
                          <div><label className="text-[10px] text-gray-500 uppercase block mb-2">Garçons</label><div className="flex items-center gap-3 bg-[#1e293b] p-3 rounded-xl border border-gray-700"><button onClick={() => setSequenceInputs({ ...sequenceInputs, boys: Math.max(0, sequenceInputs.boys - 1) })} className="text-red-400 p-1"><MinusCircle size={16} /></button><span className="text-xl font-black text-white flex-1 text-center">{sequenceInputs.boys}</span><button onClick={() => setSequenceInputs({ ...sequenceInputs, boys: sequenceInputs.boys + 1 })} className="text-emerald-400 p-1"><PlusCircle size={16} /></button></div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(sequenceInputs.specialNeeds).map(([key, val]) => (
                            <div key={key} className="bg-[#1e293b] p-4 rounded-2xl border-2 border-gray-800 flex flex-col items-center gap-3">
                              <span className="text-[10px] uppercase text-gray-500">{key === "handicap" ? "Moteur" : key.toUpperCase()}</span>
                              <div className="flex items-center gap-4">
                                <button onClick={() => setSequenceInputs({ ...sequenceInputs, specialNeeds: { ...sequenceInputs.specialNeeds, [key]: Math.max(0, val - 1) } })} className="p-2 bg-black rounded-lg"><MinusCircle size={14} /></button>
                                <span className="text-2xl font-black text-white">{val}</span>
                                <button onClick={() => setSequenceInputs({ ...sequenceInputs, specialNeeds: { ...sequenceInputs.specialNeeds, [key]: val + 1 } })} className="p-2 bg-black rounded-lg"><PlusCircle size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] uppercase text-gray-500">Total Effectif :</span>
                          <span className="text-3xl font-black text-sky-400">{sequenceInputs.girls + sequenceInputs.boys} élèves</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleAiGeneration} className="w-full py-10 bg-sky-600 rounded-[3rem] border-[6px] border-black font-black text-2xl uppercase tracking-[0.3em] hover:bg-sky-400 active:scale-95 transition-all animate-pulse flex items-center justify-center gap-4"><Wand2 size={40} /> Générer la séquence</button>
                </div>
              ) : (
                <div className="space-y-16">
                  <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[4rem] p-10 space-y-10">
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black uppercase text-sky-400 flex items-center gap-5"><Calendar size={40} /> Trame de Séquence</h3>
                      <button onClick={() => setGeneratedSequence(null)} className="p-4 bg-white/5 rounded-2xl text-xs uppercase text-gray-500 hover:text-white flex items-center gap-3"><RefreshCcw size={18} /> Réinitialiser</button>
                    </div>
                    <div className="overflow-x-auto rounded-[2.5rem] border-4 border-gray-800">
                      <table className="w-full border-collapse">
                        <thead><tr className="bg-black/40"><th className="p-6 border-r border-gray-800 text-[11px] text-gray-500 uppercase text-left min-w-[300px]">Compétences</th>{Array.from({ length: sequenceInputs.numLessons }).map((_, i) => (<th key={i} className="p-6 border-r border-gray-800 text-sm font-black text-white">L{i + 1}</th>))}</tr></thead>
                        <tbody>
                          {generatedSequence.trame.map(sk => (
                            <tr key={sk.id} className="border-t border-gray-800">
                              <td className="p-5 bg-black/20 border-r border-gray-800 text-[11px] uppercase font-black text-white">{sk.code}. {sk.name}</td>
                              {sk.foci.map((isFocus, i) => (
                                <td key={i} className="p-5 border-r border-gray-800 text-center">
                                  {isFocus && currentClass && <div className="w-8 h-8 rounded-2xl mx-auto shadow-lg animate-pulse ring-4 ring-black" style={{ backgroundColor: Object.values(CURRICULUM[currentClass.cycle].categories).find(c => c.skills.some(s => s.id === sk.id))?.color }} />}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <h3 className="text-3xl font-black uppercase text-emerald-400 flex items-center gap-5 pl-6"><TimerIcon size={40} /> Planificateur Visuel</h3>
                    <div className="space-y-12 px-6">
                      {generatedSequence.planning.map((plan, idx) => (
                        <div key={idx} className="space-y-6">
                          <div className="flex justify-between items-end px-6">
                            <h4 className="text-3xl font-black uppercase text-white">Leçon n°{plan.lesson}</h4>
                            <span className="px-6 py-2 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 text-xs uppercase">{sequenceInputs.practiceTime} min motrices</span>
                          </div>
                          <div className="h-32 w-full flex rounded-[3rem] border-[6px] border-black overflow-hidden">
                            {plan.blocks.map((block, bIdx) => (
                              <div key={bIdx} onClick={() => setSelectedSituationDetail(block)} style={{ width: `${(block.time / sequenceInputs.practiceTime) * 100}%` }} className={`${block.color} cursor-pointer relative group border-r-4 border-black/40 flex flex-col items-center justify-center p-6 transition-all hover:scale-[1.03] hover:z-20`}>
                                <span className="text-sm font-black uppercase text-white/50 mb-1">{block.time}'</span>
                                <span className="text-sm font-black uppercase text-white tracking-widest text-center leading-tight">{block.label}</span>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><Eye size={24} className="text-white" /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SITUATION DETAIL */}
        {selectedSituationDetail && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl">
            <div className="bg-[#1e293b] border-[8px] border-gray-800 rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 max-w-6xl w-full h-full max-h-[90vh] relative flex flex-col overflow-hidden">
              <div className="flex justify-between items-start mb-8 shrink-0">
                <button onClick={() => setSelectedSituationDetail(null)} className="flex items-center gap-3 bg-white/5 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm"><ArrowLeftCircle size={24} /> Retour</button>
                <button onClick={() => setSelectedSituationDetail(null)} className="p-4 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white"><X size={40} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12">
                <div className="flex items-start gap-8">
                  <div className="p-8 bg-emerald-500 text-black rounded-[2.5rem]"><BrainCircuit size={64} /></div>
                  <div>
                    <div className="text-sky-400 text-lg font-black uppercase tracking-[0.4em] mb-4">Contenu Didactique EPS</div>
                    <h3 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight">{selectedSituationDetail.title}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-12">
                    <section className="space-y-4">
                      <h4 className="text-2xl text-emerald-400 font-black flex items-center gap-4 uppercase"><Target size={32} /> Objectifs</h4>
                      <p className="text-xl text-white font-bold leading-relaxed">{selectedSituationDetail.content}</p>
                      <div className="p-4 bg-white/5 rounded-2xl"><p className="text-sm font-bold text-emerald-400 uppercase mb-2">But :</p><p className="text-lg text-white">{selectedSituationDetail.goals}</p></div>
                    </section>
                    <section className="space-y-4">
                      <h4 className="text-2xl text-yellow-400 font-black flex items-center gap-4 uppercase"><ClipboardCheck size={32} /> Critères de Réussite</h4>
                      <div className="p-6 bg-yellow-400/10 border-l-8 border-yellow-400 rounded-2xl"><p className="text-lg text-white font-bold">{selectedSituationDetail.criteria}</p></div>
                    </section>
                  </div>
                  <div className="bg-black/60 rounded-[4rem] border-8 border-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="text-center w-full">
                      <div className="w-64 h-80 border-4 border-white/20 rounded-2xl relative mx-auto overflow-hidden">
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-white/40" />
                        {selectedSituationDetail.schema.includes("JONGLES") ? (
                          <><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500/80 rounded-full animate-bounce" /><div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-8 h-8 bg-sky-500/80 rounded-full" /></>
                        ) : selectedSituationDetail.schema.includes("TACTIC") ? (
                          <><div className="absolute top-[10%] left-[10%] w-12 h-12 border-4 border-emerald-500 rounded-full animate-pulse opacity-50" /><div className="absolute top-[10%] right-[10%] w-12 h-12 border-4 border-emerald-500 rounded-full animate-pulse opacity-50" /><div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-8 h-8 bg-sky-500/80 rounded-full" /></>
                        ) : (
                          <><div className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-500/80 rounded-full" /><div className="absolute bottom-1/4 right-1/4 w-8 h-8 bg-sky-500/80 rounded-full" /></>
                        )}
                      </div>
                      <p className="mt-8 text-sm text-gray-500 font-black uppercase">Dispositif : {selectedSituationDetail.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LABO LIVE */}
        {dashboardMode === "situations" && view !== "profile" && (
          <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
            {situationFlow === "config" && currentClass && (
              <div className="flex-1 overflow-y-auto p-12">
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-sky-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-sky-500 border-4 border-sky-500/20"><Settings2 size={40} /></div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Labo <span className="text-sky-500">Situations</span></h2>
                  </div>
                  <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[3rem] p-10 space-y-8">
                    <h3 className="text-xl font-black uppercase text-white flex items-center gap-4"><Target size={24} className="text-sky-400" /> Compétences mobilisées</h3>
                    <div className="grid grid-cols-1 gap-8">
                      {Object.entries(CURRICULUM[currentClass.cycle].categories).map(([catKey, cat]) => (
                        <div key={catKey} className="space-y-3">
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-gray-500"><IconRenderer name={cat.iconName} size={14} /> {cat.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {cat.skills.map(sk => (
                              <button key={sk.id} onClick={() => setSelectedSkillsForSituation(prev => prev.includes(sk.id) ? prev.filter(i => i !== sk.id) : [...prev, sk.id])} className={`p-4 rounded-xl border-4 font-black text-[9px] uppercase text-left ${selectedSkillsForSituation.includes(sk.id) ? "bg-sky-600 border-white text-white" : "bg-black/40 border-gray-800 text-gray-600 hover:border-sky-500/50"}`}>{sk.name}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button disabled={selectedSkillsForSituation.length === 0} onClick={() => { setSituationFlow("live"); setActiveSkillId(selectedSkillsForSituation[0]); }} className={`w-full py-6 rounded-3xl border-4 border-black font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 ${selectedSkillsForSituation.length > 0 ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-gray-800 text-gray-600"}`}><Play size={24} /> Lancer Session Live</button>
                  </div>
                </div>
              </div>
            )}
            {situationFlow === "live" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-black/90 border-b-4 border-gray-800 p-4 px-8 flex items-center justify-between">
                  <div className="flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center animate-pulse"><Clock size={20} /></div><div className="text-xl font-black text-white uppercase">Recueil Live</div></div>
                  <div className="flex flex-wrap gap-2 justify-center flex-1 mx-8">
                    {selectedSkillsForSituation.map(skId => {
                      const skillObj = allSkillsFlat.find(s => s.id === skId);
                      return (<button key={skId} onClick={() => setActiveSkillId(skId)} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase whitespace-nowrap ${activeSkillId === skId ? "bg-sky-600 text-white border-2 border-white/20" : "text-gray-500 hover:text-white bg-white/5"}`}>{skillObj?.code}. {skillObj?.name}</button>);
                    })}
                  </div>
                  <button onClick={() => setSituationFlow("report")} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase border-4 border-black">ARRÊTER</button>
                </div>
                <div className="bg-sky-600 p-3 px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 border-b-4 border-black overflow-y-auto max-h-[120px]">
                  {activeSkillId && allSkillsFlat.find(s => s.id === activeSkillId)?.levels.map((txt, idx) => (
                    <div key={idx} className="flex gap-2 items-start opacity-90"><div className="w-6 h-6 rounded bg-black border border-white flex items-center justify-center font-black text-white shrink-0 text-[8px] mt-0.5">P{idx + 1}</div><div className="text-[9px] leading-tight text-white font-bold">{txt}</div></div>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-3">
                    {currentStudents.map(s => {
                      const curPalier = s.skillStates[activeSkillId || ""] || 0;
                      return (
                        <div key={s.id} className="relative">
                          <button onClick={() => activeSkillId && updateStudentSkill(s.id, activeSkillId, "up", true)} className={`w-full p-3 py-5 rounded-2xl border-2 active:scale-90 flex flex-col items-center gap-2 ${curPalier >= 5 ? "bg-yellow-400/20 border-yellow-500 opacity-60" : "bg-[#1e293b] border-gray-700 hover:border-emerald-500"}`}>
                            <div className="text-xl font-black text-white">{s.name[0]}</div>
                            <div className="text-[9px] font-bold uppercase truncate w-full text-center text-gray-400">{s.name}</div>
                            <div className={`text-lg font-black ${curPalier >= 4 ? "text-yellow-400" : "text-emerald-400"}`}>P{curPalier}</div>
                          </button>
                          {curPalier > 0 && (<button onClick={(e) => { e.stopPropagation(); activeSkillId && updateStudentSkill(s.id, activeSkillId, "down", true); }} className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center"><MinusCircle size={14} /></button>)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {situationFlow === "report" && (
              <div className="flex-1 overflow-y-auto p-12">
                <div className="max-w-6xl mx-auto space-y-12">
                  <div className="text-center"><h2 className="text-6xl font-black uppercase tracking-tighter text-white">Bilan <span className="text-emerald-500">Stadium</span></h2></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[3rem] p-10 space-y-8">
                      <h3 className="text-xl font-black uppercase text-emerald-400 flex items-center gap-3"><ArrowUpCircle size={24} /> RÉUSSITES ({sessionLogs.length})</h3>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                        {sessionLogs.length === 0 ? <p className="text-gray-600 font-bold">Aucun progrès noté.</p> : sessionLogs.map((log, i) => (
                          <div key={i} className="bg-black/40 p-4 rounded-2xl flex items-center justify-between border-2 border-white/5">
                            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded bg-emerald-500 text-black flex items-center justify-center font-black">{currentStudents.find(s => s.id === log.studentId)?.name[0]}</div><div><div className="text-[12px] font-black uppercase text-white">{currentStudents.find(s => s.id === log.studentId)?.name}</div><div className="text-[9px] font-bold text-sky-400 uppercase">{allSkillsFlat.find(sk => sk.id === log.skillId)?.name}</div></div></div>
                            <div className="flex items-center gap-3 text-emerald-400 font-black"><span className="text-xs">P{log.oldPalier}</span><ChevronRight size={14} /><span className="text-lg font-black underline">P{log.newPalier}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[3rem] p-10 space-y-8">
                      <h3 className="text-xl font-black uppercase text-red-400 flex items-center gap-3"><AlertCircle size={24} /> ANALYSE DES BLOCAGES</h3>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                        {(() => {
                          const stagnations: Array<{ student: Student; skillId: string }> = [];
                          currentStudents.forEach(s => {
                            selectedSkillsForSituation.forEach(skId => {
                              if (!sessionLogs.some(log => log.studentId === s.id && log.skillId === skId)) stagnations.push({ student: s, skillId: skId });
                            });
                          });
                          return stagnations.map((stagnation, i) => (
                            <div key={i} className="bg-black/40 p-6 rounded-3xl border-2 border-white/5 space-y-4">
                              <div className="flex items-center gap-4"><div className="w-8 h-8 rounded bg-gray-800 text-gray-500 flex items-center justify-center font-black">{stagnation.student.name[0]}</div><div><div className="text-xs font-black uppercase text-white">{stagnation.student.name}</div><div className="text-[9px] font-bold text-gray-500 uppercase">{allSkillsFlat.find(sk => sk.id === stagnation.skillId)?.name}</div></div></div>
                              <select value={stagnationFeedback[`${stagnation.student.id}-${stagnation.skillId}`] || ""} onChange={(e) => setStagnationFeedback(prev => ({ ...prev, [`${stagnation.student.id}-${stagnation.skillId}`]: e.target.value }))} className="w-full bg-black/60 border-2 border-gray-800 rounded-xl p-3 text-[10px] font-bold text-gray-400 outline-none uppercase">
                                <option value="">CODER LE FREIN...</option>
                                {STAGNATION_REASONS.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
                              </select>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  <button onClick={archiveSituation} className="w-full bg-yellow-400 text-black py-8 rounded-[2.5rem] border-4 border-black font-black text-xl uppercase hover:bg-yellow-300">VALIDER ET RETOUR</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFIL ÉLÈVE */}
        {view === "profile" && student && currentClass && (
          <div ref={profileContainerRef} className="absolute inset-0 bg-[#0f172a] z-[3000] overflow-y-auto p-10">
            <button onClick={() => { setView("dashboard"); }} className="flex items-center gap-3 text-sky-400 hover:text-white font-black uppercase text-xs tracking-widest group mb-12"><div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500 transition-all"><ArrowLeft size={20} /></div> Retour</button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[3.5rem] p-10 relative overflow-hidden">
                  <div className="flex flex-col items-center gap-8 mb-12">
                    <div className="relative w-48 h-48">
                      <div className="absolute -inset-4 bg-sky-400 blur-3xl opacity-20 rounded-full animate-pulse" />
                      <div className="relative w-full h-full bg-black rounded-[3rem] border-4 border-gray-700 flex items-center justify-center text-6xl font-black text-yellow-400">{student.name[0]}</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-10 py-3 rounded-2xl font-black text-2xl border-4 border-black">N{student.level}/24</div>
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white mt-4">{student.name}</h2>
                  </div>
                  <div className="bg-black/40 border-2 border-gray-800 rounded-[2.5rem] p-8 flex flex-col justify-center items-center">
                    <FullSpectrumRadar skillStates={student.skillStates} cycle={currentClass.cycle} size={300} />
                  </div>
                </div>
                <div className="bg-[#1e293b] border-4 border-gray-800 rounded-[3.5rem] p-10 space-y-8">
                  <h3 className="text-2xl font-black uppercase text-sky-400 flex items-center gap-4"><History size={28} className="text-sky-400" /> Journal des Défis</h3>
                  <div className="space-y-6">
                    {(!student.stagnations || student.stagnations.length === 0) ? (<p className="text-gray-600 text-sm font-bold">Aucun blocage noté.</p>) : (
                      student.stagnations.map((st, i) => (
                        <div key={i} className="bg-black/30 border-2 border-white/5 p-6 rounded-[2rem] space-y-4">
                          <div className="flex justify-between items-start"><div className="text-xs font-black text-white uppercase">Obstacle : {st.skillName} (P{st.palierCible})</div><div className="text-[10px] text-gray-500 font-bold">{st.date}</div></div>
                          {st.reason !== "Non renseigné" && st.remediation && (
                            <div className="bg-sky-500/10 p-4 rounded-xl flex items-start gap-3 border-l-4 border-sky-400"><Lightbulb className="text-sky-400 shrink-0" size={16} /><div className="text-[11px] text-sky-100 font-bold"><span className="text-sky-400 uppercase font-black text-[9px] block mb-1">REMÉDIATION :</span>{st.remediation}</div></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 space-y-10 pb-40">
                {Object.entries(CURRICULUM[currentClass.cycle].categories).map(([key, section]) => (
                  <div key={key} className="bg-[#1e293b]/40 border-4 border-gray-800 rounded-[3.5rem] p-10">
                    <div className="flex items-center gap-6 mb-10"><div className="w-16 h-16 rounded-3xl border-4 border-white flex items-center justify-center text-white" style={{ backgroundColor: section.color }}><IconRenderer name={section.iconName} /></div><div><h4 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{section.label}</h4></div></div>
                    <div className="grid grid-cols-1 gap-10">
                      {section.skills.map(skill => {
                        const curLv = student.skillStates[skill.id] || 0;
                        return (
                          <div key={skill.id} className="bg-black/40 border-2 border-gray-800 rounded-3xl p-8 hover:border-yellow-400/30 transition-all">
                            <div className="flex-1 w-full space-y-6">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[14px] font-black text-sky-400 uppercase tracking-tighter pr-4">{skill.name}</h5>
                                <div className="flex gap-1 shrink-0">{[1, 2, 3, 4, 5].map(l => <Star key={l} size={16} className={`${l <= curLv ? (l === 5 ? "text-yellow-400 fill-yellow-400" : "text-emerald-400 fill-emerald-400") : "text-gray-800"}`} />)}</div>
                              </div>
                              <div className="bg-white/5 p-5 rounded-2xl border-l-4 border-emerald-500"><div className="text-[10px] font-black uppercase text-emerald-500 mb-2 flex items-center gap-2"><CheckCircle2 size={14} /> Acquis</div><div className="text-[12px] text-white font-bold leading-relaxed">{curLv > 0 ? skill.levels[curLv - 1] : "Observation..."}</div></div>
                              <div className="flex gap-3 justify-center">
                                {curLv > 0 && <button onClick={() => updateStudentSkill(student.id, skill.id, "down")} className="p-5 bg-gray-800 border-2 border-black text-gray-400 hover:text-white hover:border-red-500 active:scale-95"><Undo2 size={24} /></button>}
                                {curLv < 5 && <button onClick={() => updateStudentSkill(student.id, skill.id, "up")} className={`flex-1 px-8 py-5 rounded-2xl border-4 border-black text-white font-black text-xs uppercase active:scale-95 ${curLv === 4 ? "bg-yellow-600" : "bg-sky-600"}`}>Valider {curLv === 4 ? "EXCELLENCE" : `P${curLv + 1}`}</button>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isAiGenerating && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl z-[10000] flex flex-col items-center justify-center">
          <div className="w-48 h-48 relative">
            <div className="absolute inset-0 border-[12px] border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-[12px] border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <Rocket size={80} className="text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <p className="mt-12 text-3xl font-black uppercase tracking-[0.4em] text-sky-400 animate-pulse">Génération Didactique...</p>
        </div>
      )}
    </div>
  );
};

function AppWrapper() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
