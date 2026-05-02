// Mode "Situation" — live in-class evaluation cockpit.
// Three phases: SETUP → LIVE → DEBRIEF.
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Play, CheckCircle2, AlertTriangle, TrendingUp, Flag, Plus, Minus,
  Activity, Brain, Users, SortAsc, SortDesc, Trophy, ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { PopButton } from "@/components/game/PopButton";
import { AvatarBlob } from "@/components/game/AvatarBlob";
import { CURRICULUM, type DimensionKey, MAX_SKILL_STARS, findSkillMeta, type Student } from "@/data/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/class/$classId/situation")({
  component: SituationMode,
});

type Phase = "setup" | "live" | "debrief";
type SortMode = "name-asc" | "name-desc" | "level-asc" | "level-desc";
type EvalFilter = "all" | "evaluated" | "pending";

const DIM_META: Record<DimensionKey, { label: string; iconName: "Activity" | "Brain" | "Users"; color: string }> = {
  moteur: { label: "Motrice", iconName: "Activity", color: "bg-[oklch(0.65_0.22_25)] text-white" },
  methodo: { label: "Méthodo", iconName: "Brain", color: "bg-[oklch(0.82_0.18_115)] text-ink" },
  social: { label: "Sociale", iconName: "Users", color: "bg-[oklch(0.65_0.18_240)] text-white" },
};

function DimIcon({ name, size = 16 }: { name: "Activity" | "Brain" | "Users"; size?: number }) {
  if (name === "Activity") return <Activity size={size} strokeWidth={3} />;
  if (name === "Brain") return <Brain size={size} strokeWidth={3} />;
  return <Users size={size} strokeWidth={3} />;
}

function SituationMode() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { classes, studentsByClass, ensureClass, bumpSkill, recordSituation, setLevelUpSuspended } = useAppStore();
  const cls = classes.find((c) => c.id === classId);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Record<string, Record<string, number>>>({});
  const [outcome, setOutcome] = useState<ReturnType<typeof recordSituation> | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  // Live toolbar
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [evalFilter, setEvalFilter] = useState<EvalFilter>("all");

  // Debrief level-up cinematic queue (skippable)
  const [lvlIdx, setLvlIdx] = useState(0);
  const skipRef = useRef(false);

  useEffect(() => { if (classId) ensureClass(classId); }, [classId, ensureClass]);

  // Suspend global level-up overlay while running a situation; release on unmount or phase change away from live.
  useEffect(() => {
    setLevelUpSuspended(phase === "live");
    return () => setLevelUpSuspended(false);
  }, [phase, setLevelUpSuspended]);

  const students = studentsByClass[classId] || [];
  const cycle = cls?.cycle;
  const categories = cycle ? CURRICULUM[cycle].categories : null;

  const allSkills = useMemo(() => {
    if (!categories) return [];
    return (Object.keys(categories) as DimensionKey[]).flatMap((dim) =>
      categories[dim].skills.map((s) => ({ ...s, dimension: dim }))
    );
  }, [categories]);

  const targeted = allSkills.filter((s) => selectedSkills.includes(s.id));
  const activeSkill = targeted.find((s) => s.id === activeSkillId);

  // ------- SETUP -------
  const toggleSkill = (id: string) =>
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const startSituation = () => {
    if (!selectedSkills.length) return;
    const snap: Record<string, Record<string, number>> = {};
    students.forEach((s) => {
      snap[s.id] = {};
      selectedSkills.forEach((skId) => {
        snap[s.id][skId] = s.skillStates[skId] ?? 0;
      });
    });
    setSnapshot(snap);
    setActiveSkillId(selectedSkills[0]);
    setPhase("live");
  };

  // ------- LIVE -------
  const finishSituation = () => {
    const result = recordSituation(classId, selectedSkills, snapshot);
    setOutcome(result);
    setLvlIdx(0);
    skipRef.current = false;
    setPhase("debrief");
  };

  // Sorted/filtered student list for the LIVE grid
  const liveStudents = useMemo(() => {
    if (!activeSkillId) return [];
    const list = students.map((s) => {
      const stars = s.skillStates[activeSkillId] ?? 0;
      const before = snapshot[s.id]?.[activeSkillId] ?? 0;
      return { s, stars, before, evaluated: stars !== before };
    });
    const filtered = list.filter((it) => {
      if (evalFilter === "evaluated") return it.evaluated;
      if (evalFilter === "pending") return !it.evaluated;
      return true;
    });
    filtered.sort((a, b) => {
      switch (sortMode) {
        case "name-asc": return a.s.name.localeCompare(b.s.name);
        case "name-desc": return b.s.name.localeCompare(a.s.name);
        case "level-asc": return a.stars - b.stars;
        case "level-desc": return b.stars - a.stars;
      }
    });
    return filtered;
  }, [students, activeSkillId, snapshot, sortMode, evalFilter]);

  if (!cls || !categories) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="pop-card p-8 text-center">
          <p className="font-display text-3xl">Classe introuvable</p>
          <PopButton variant="primary" onClick={() => navigate({ to: "/" })} className="mt-4">Retour</PopButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b-[3px] border-ink">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <PopButton variant="ghost" size="sm" onClick={() => navigate({ to: "/class/$classId", params: { classId } })}>
              <ArrowLeft size={16} strokeWidth={3} /> Retour
            </PopButton>
            <div>
              <h1 className="font-display text-2xl md:text-3xl leading-none">Mode Situation · {cls.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                {phase === "setup" && "Configuration"}
                {phase === "live" && "Évaluation en direct"}
                {phase === "debrief" && "Bilan"}
              </span>
            </div>
          </div>
          {phase === "live" && (
            <PopButton variant="hot" size="md" onClick={finishSituation}>
              <Flag size={16} strokeWidth={3} /> Terminer
            </PopButton>
          )}
        </div>
      </header>

      {/* ============== SETUP ============== */}
      {phase === "setup" && (
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
          <div className="pop-card p-6">
            <h2 className="font-display text-2xl mb-1">Compétences travaillées</h2>
            <p className="text-sm font-semibold text-ink-soft mb-5">
              Sélectionne les compétences ciblées par la situation. Tu pourras les évaluer en direct, élève par élève.
            </p>

            {(Object.keys(categories) as DimensionKey[]).map((dim) => {
              const meta = DIM_META[dim];
              return (
                <div key={dim} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("inline-grid place-items-center w-7 h-7 rounded-full border-[2.5px] border-ink", meta.color)}>
                      <DimIcon name={meta.iconName} size={14} />
                    </span>
                    <h3 className="font-display tracking-wide text-sm uppercase">Dimension {meta.label}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {categories[dim].skills.map((sk) => {
                      const checked = selectedSkills.includes(sk.id);
                      return (
                        <button
                          key={sk.id}
                          onClick={() => toggleSkill(sk.id)}
                          className={cn(
                            "text-left p-3 rounded-2xl border-[3px] border-ink transition-all",
                            checked ? "bg-primary text-primary-foreground shadow-pop-sm" : "bg-surface hover:bg-surface-2"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display text-xs px-2 py-0.5 rounded-full bg-ink text-surface">{sk.code}</span>
                            {checked && <CheckCircle2 size={14} strokeWidth={3} />}
                          </div>
                          <p className="text-xs font-semibold leading-snug">{sk.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <PopButton variant="primary" size="lg" onClick={startSituation} disabled={!selectedSkills.length || !students.length}>
              <Play size={18} strokeWidth={3} /> Démarrer la Situation ({selectedSkills.length})
            </PopButton>
          </div>

          {!students.length && (
            <p className="text-center text-sm font-semibold text-ink-soft">Aucun élève dans cette classe — ajoute-en avant de démarrer.</p>
          )}
        </section>
      )}

      {/* ============== LIVE ============== */}
      {phase === "live" && activeSkill && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          {/* Skill tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {targeted.map((sk) => {
              const meta = DIM_META[sk.dimension];
              const isActive = sk.id === activeSkillId;
              return (
                <button
                  key={sk.id}
                  onClick={() => setActiveSkillId(sk.id)}
                  className={cn(
                    "px-3 py-2 rounded-2xl border-[3px] border-ink font-display text-xs tracking-wide flex items-center gap-2 transition-all",
                    isActive ? "bg-ink text-surface shadow-pop-sm -translate-y-0.5" : "bg-surface hover:bg-surface-2"
                  )}
                >
                  <span className={cn("inline-grid place-items-center w-5 h-5 rounded-full border-[2px] border-ink", meta.color)}>
                    <DimIcon name={meta.iconName} size={10} />
                  </span>
                  {sk.code} · {meta.label}
                </button>
              );
            })}
          </div>

          {/* Heading + criteria */}
          <div className="pop-card p-4 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Compétence évaluée</span>
            <h2 className="font-display text-xl leading-snug mb-3">{activeSkill.code} — {activeSkill.name}</h2>

            <div className="border-t-2 border-dashed border-ink/15 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-2">Critères d'acquisition (paliers)</p>
              <ol className="grid md:grid-cols-2 gap-1.5">
                {activeSkill.levels.map((lvl, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-semibold leading-snug">
                    <span className="shrink-0 inline-grid place-items-center w-5 h-5 rounded-full bg-gradient-sun border-[2px] border-ink font-display text-[10px]">
                      {i + 1}
                    </span>
                    <span>{lvl}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Toolbar — tri + filtre */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-soft">Tri</span>
            {([
              { k: "name-asc", label: "A→Z", icon: <SortAsc size={12} strokeWidth={3} /> },
              { k: "name-desc", label: "Z→A", icon: <SortDesc size={12} strokeWidth={3} /> },
              { k: "level-asc", label: "Niv ↑", icon: <SortAsc size={12} strokeWidth={3} /> },
              { k: "level-desc", label: "Niv ↓", icon: <SortDesc size={12} strokeWidth={3} /> },
            ] as const).map((opt) => (
              <button
                key={opt.k}
                onClick={() => setSortMode(opt.k)}
                className={cn(
                  "px-2.5 py-1 rounded-xl border-[2.5px] border-ink font-display text-[11px] tracking-widest inline-flex items-center gap-1 transition-all",
                  sortMode === opt.k ? "bg-secondary text-secondary-foreground shadow-pop-sm" : "bg-surface hover:bg-surface-2"
                )}
              >
                {opt.icon} {opt.label}
              </button>
            ))}

            <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-soft">État</span>
            {([
              { k: "all", label: "Tous" },
              { k: "evaluated", label: "Évalués" },
              { k: "pending", label: "Non évalués" },
            ] as const).map((opt) => (
              <button
                key={opt.k}
                onClick={() => setEvalFilter(opt.k)}
                className={cn(
                  "px-2.5 py-1 rounded-xl border-[2.5px] border-ink font-display text-[11px] tracking-widest transition-all",
                  evalFilter === opt.k ? "bg-primary text-primary-foreground shadow-pop-sm" : "bg-surface hover:bg-surface-2"
                )}
              >
                {opt.label}
              </button>
            ))}

            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              {liveStudents.length} / {students.length} élèves
            </span>
          </div>

          {/* Compact student grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {liveStudents.map(({ s, stars, before, evaluated }) => {
              const moved = stars - before;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "pop-card p-2.5 flex flex-col gap-1.5 relative",
                    evaluated && "ring-2 ring-secondary/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AvatarBlob name={s.name} hue={s.avatarHue} size={32} rank="rookie" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm leading-tight truncate">{s.name}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-ink-soft">
                        Niv. {stars}{moved !== 0 && (
                          <span className={cn("ml-1", moved > 0 ? "text-secondary" : "text-hot")}>
                            {moved > 0 ? `+${moved}` : moved}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* dots */}
                  <div className="flex items-center gap-0.5 justify-center">
                    {Array.from({ length: MAX_SKILL_STARS }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full border-[1.5px] border-ink transition-all",
                          i < stars ? "bg-gradient-sun" : "bg-surface-2"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      onClick={() => { bumpSkill(classId, s.id, activeSkill.id, "down"); setPulseKey((k) => k + 1); }}
                      disabled={stars <= 0}
                      className="flex-1 h-9 rounded-xl border-[2.5px] border-ink bg-surface hover:bg-hot hover:text-hot-foreground active:translate-y-[2px] transition-all grid place-items-center disabled:opacity-40"
                      aria-label="Diminuer"
                    >
                      <Minus size={16} strokeWidth={3.5} />
                    </button>
                    <button
                      onClick={() => { bumpSkill(classId, s.id, activeSkill.id, "up"); setPulseKey((k) => k + 1); }}
                      disabled={stars >= MAX_SKILL_STARS}
                      className="flex-[1.4] h-9 rounded-xl border-[2.5px] border-ink bg-primary text-primary-foreground shadow-pop-sm hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-all grid place-items-center disabled:opacity-40"
                      aria-label="Augmenter"
                    >
                      <Plus size={18} strokeWidth={3.5} />
                    </button>
                  </div>
                </div>
              );
            })}
            {liveStudents.length === 0 && (
              <div className="col-span-full text-center py-12 font-semibold text-ink-soft">
                Aucun élève ne correspond au filtre.
              </div>
            )}
          </div>
          <div key={pulseKey} className="sr-only">tap</div>
        </section>
      )}

      {/* ============== DEBRIEF ============== */}
      {phase === "debrief" && outcome && (
        <>
          {/* Skippable level-up cinematic — ONLY for the actual concerned student, sequentially */}
          {!skipRef.current && outcome.levelUps.length > 0 && lvlIdx < outcome.levelUps.length && (
            <DebriefLevelUp
              event={outcome.levelUps[lvlIdx]}
              onNext={() => setLvlIdx((i) => i + 1)}
              onSkipAll={() => { skipRef.current = true; setLvlIdx(outcome.levelUps.length); }}
            />
          )}

          <section className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-5">
            {outcome.levelUps.length > 0 && (
              <div className="pop-card p-5 bg-gradient-to-br from-primary/15 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="text-primary" strokeWidth={3} />
                  <h2 className="font-display text-2xl">Niveaux gagnés ({outcome.levelUps.length})</h2>
                </div>
                <ul className="space-y-1.5">
                  {outcome.levelUps.map((p, i) => (
                    <li key={i} className="text-sm font-semibold flex items-center gap-2">
                      <span>{p.studentName}</span>
                      <span className="text-ink-soft">Niv {p.oldLevel} → {p.newLevel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DebriefProgressList
              progressed={outcome.progressed}
              students={students}
              cycle={cycle!}
            />
            {/* keep stagnated section below — replaced by DebriefProgressList for progressions */}

            <div className="pop-card p-5 bg-gradient-to-br from-hot/15 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-hot" strokeWidth={3} />
                <h2 className="font-display text-2xl">Vigilance · Difficultés ({outcome.stagnated.length})</h2>
              </div>
              {outcome.stagnated.length === 0 ? (
                <p className="text-sm font-semibold text-ink-soft">Aucune stagnation détectée.</p>
              ) : (
                <ul className="space-y-1.5">
                  {outcome.stagnated.map((p, i) => (
                    <li key={i} className="text-sm font-semibold flex items-center gap-2">
                      <span className="font-display px-2 py-0.5 rounded-full bg-hot text-hot-foreground text-[10px]">{p.skillCode}</span>
                      <span>{p.studentName}</span>
                      <span className="text-ink-soft">bloqué N{p.level}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <PopButton variant="ghost" size="md" onClick={() => { setPhase("setup"); setOutcome(null); setSelectedSkills([]); }}>
                Nouvelle situation
              </PopButton>
              <PopButton variant="primary" size="md" onClick={() => navigate({ to: "/class/$classId", params: { classId } })}>
                Retour à la classe
              </PopButton>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

/** Skippable level-up overlay shown during debrief, scoped to a single student. */
function DebriefLevelUp({
  event, onNext, onSkipAll,
}: {
  event: { studentId: string; studentName: string; oldLevel: number; newLevel: number };
  onNext: () => void;
  onSkipAll: () => void;
}) {
  return (
    <div
      onClick={onNext}
      className="fixed inset-0 z-[7000] grid place-items-center bg-ink/85 backdrop-blur-md cursor-pointer animate-fade-in select-none overflow-hidden"
      role="dialog"
      aria-label="Niveau gagné"
    >
      <div className="text-center px-6 animate-pop-in">
        <div className="relative inline-grid place-items-center mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl scale-150" />
          <div className="relative grid place-items-center w-32 h-32 rounded-full bg-gradient-sun border-[6px] border-ink shadow-pop-lg animate-bounce-soft">
            <Trophy size={64} className="text-ink" strokeWidth={2.5} />
          </div>
        </div>

        <p className="font-display text-2xl md:text-3xl tracking-widest text-secondary mb-1">
          ✨ Level Up ! ✨
        </p>
        <h1 className="font-display text-5xl md:text-7xl text-surface drop-shadow-[0_4px_0_hsl(var(--ink))] mb-6">
          {event.studentName}
        </h1>

        <div className="inline-flex items-center gap-5 md:gap-8 bg-surface border-[4px] border-ink rounded-3xl px-6 py-5 shadow-pop-lg">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Avant</div>
            <div className="font-display text-4xl text-muted-foreground">N{event.oldLevel}</div>
          </div>
          <ChevronRight size={36} className="text-primary animate-pulse" strokeWidth={3} />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase text-accent tracking-wider">Nouveau</div>
            <div className="font-display text-6xl text-gradient-sun">N{event.newLevel}</div>
          </div>
        </div>

        <p className="text-surface/70 text-[10px] uppercase tracking-widest mt-6">
          Touche pour continuer ·{" "}
          <button
            onClick={(e) => { e.stopPropagation(); onSkipAll(); }}
            className="underline hover:text-surface"
          >
            Tout passer
          </button>
        </p>
      </div>
    </div>
  );
}

interface ProgressedItem {
  studentId: string;
  studentName: string;
  skillId: string;
  skillCode: string;
  before: number;
  after: number;
}

function DebriefProgressList({
  progressed, students, cycle,
}: {
  progressed: ProgressedItem[];
  students: Student[];
  cycle: "cycle3" | "cycle4";
}) {
  const [genderFilter, setGenderFilter] = useState<"All" | "F" | "M">("All");
  const [dimFilter, setDimFilter] = useState<"all" | DimensionKey>("all");

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const enriched = useMemo(() => {
    return progressed.map((p) => {
      const meta = findSkillMeta(cycle, p.skillId);
      const student = studentMap.get(p.studentId);
      return { ...p, dimension: meta?.dimension as DimensionKey | undefined, gender: student?.gender };
    });
  }, [progressed, studentMap, cycle]);

  const filtered = useMemo(() => {
    const list = enriched.filter((p) => {
      if (genderFilter !== "All" && p.gender !== genderFilter) return false;
      if (dimFilter !== "all" && p.dimension !== dimFilter) return false;
      return true;
    });
    list.sort((a, b) => a.before - b.before || a.after - b.after || a.studentName.localeCompare(b.studentName));
    return list;
  }, [enriched, genderFilter, dimFilter]);

  return (
    <div className="pop-card p-5 bg-gradient-to-br from-secondary/20 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="text-secondary" strokeWidth={3} />
        <h2 className="font-display text-2xl">Progressions ({progressed.length})</h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-3 border-b-2 border-dashed border-ink/15">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mr-1">Genre</span>
        {(["All", "F", "M"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGenderFilter(g)}
            className={cn(
              "px-2.5 py-1 rounded-xl border-[2.5px] border-ink font-display text-[11px] tracking-widest transition-all",
              genderFilter === g ? "bg-ink text-surface shadow-pop-sm" : "bg-surface hover:bg-surface-2"
            )}
          >
            {g === "All" ? "Tous" : g === "F" ? "F" : "M"}
          </button>
        ))}
        <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-ink-soft mr-1">Dimension</span>
        {([
          { k: "all", label: "Toutes", cls: "" },
          { k: "moteur", label: "Moteur", cls: "bg-[oklch(0.65_0.22_25)] text-white" },
          { k: "methodo", label: "Méthodo", cls: "bg-[oklch(0.82_0.18_115)] text-ink" },
          { k: "social", label: "Social", cls: "bg-[oklch(0.65_0.18_240)] text-white" },
        ] as const).map((opt) => (
          <button
            key={opt.k}
            onClick={() => setDimFilter(opt.k as typeof dimFilter)}
            className={cn(
              "px-2.5 py-1 rounded-xl border-[2.5px] border-ink font-display text-[11px] tracking-widest transition-all",
              dimFilter === opt.k ? `${opt.cls || "bg-secondary text-secondary-foreground"} shadow-pop-sm` : "bg-surface hover:bg-surface-2"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm font-semibold text-ink-soft">Aucune progression à afficher.</p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((p, i) => (
            <li key={i} className="text-sm font-semibold flex items-center gap-2">
              <span className="font-display px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">{p.skillCode}</span>
              <span>{p.studentName}</span>
              <span className="text-ink-soft">N{p.before} → N{p.after}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
