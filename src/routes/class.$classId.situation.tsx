// Mode "Situation" — live in-class evaluation cockpit.
// Three phases: SETUP → LIVE → DEBRIEF.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, CheckCircle2, AlertTriangle, TrendingUp, Flag, Plus, Minus, Activity, Brain, Users } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { PopButton } from "@/components/game/PopButton";
import { AvatarBlob } from "@/components/game/AvatarBlob";
import { CURRICULUM, type DimensionKey, MAX_SKILL_STARS } from "@/data/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/class/$classId/situation")({
  component: SituationMode,
});

type Phase = "setup" | "live" | "debrief";

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
  const { classes, studentsByClass, ensureClass, bumpSkill, recordSituation } = useAppStore();
  const cls = classes.find((c) => c.id === classId);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Record<string, Record<string, number>>>({});
  const [outcome, setOutcome] = useState<ReturnType<typeof recordSituation> | null>(null);
  const [pulseKey, setPulseKey] = useState(0); // for tap micro-anim

  useEffect(() => { if (classId) ensureClass(classId); }, [classId, ensureClass]);

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

  // ------- SETUP -------
  const toggleSkill = (id: string) =>
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const startSituation = () => {
    if (!selectedSkills.length) return;
    // capture BEFORE state for every student × selected skill
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
    setPhase("debrief");
  };

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
      {phase === "live" && activeSkillId && (
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          {/* tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
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

          {/* current skill heading */}
          {(() => {
            const sk = targeted.find((s) => s.id === activeSkillId)!;
            return (
              <div className="pop-card p-4 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Compétence évaluée</span>
                <h2 className="font-display text-xl leading-snug">{sk.code} — {sk.name}</h2>
              </div>
            );
          })()}

          {/* student rows */}
          <div className="space-y-2">
            {students.map((s) => {
              const stars = s.skillStates[activeSkillId] ?? 0;
              const before = snapshot[s.id]?.[activeSkillId] ?? 0;
              const moved = stars - before;
              return (
                <div key={s.id} className="pop-card p-3 flex items-center gap-3">
                  <AvatarBlob name={s.name} hue={s.avatarHue} size={44} rank="rookie" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base truncate">{s.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: MAX_SKILL_STARS }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "w-3 h-3 rounded-full border-[2px] border-ink transition-all",
                            i < stars ? "bg-gradient-sun" : "bg-surface-2"
                          )}
                        />
                      ))}
                      {moved !== 0 && (
                        <span className={cn(
                          "ml-2 text-[10px] font-bold uppercase tracking-widest",
                          moved > 0 ? "text-secondary" : "text-hot"
                        )}>
                          {moved > 0 ? `+${moved}` : moved}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { bumpSkill(classId, s.id, activeSkillId, "down"); setPulseKey((k) => k + 1); }}
                      disabled={stars <= 0}
                      className="w-12 h-12 rounded-2xl border-[3px] border-ink bg-surface hover:bg-hot hover:text-hot-foreground active:translate-y-[2px] transition-all grid place-items-center disabled:opacity-40"
                      aria-label="Diminuer"
                    >
                      <Minus size={20} strokeWidth={3.5} />
                    </button>
                    <button
                      onClick={() => { bumpSkill(classId, s.id, activeSkillId, "up"); setPulseKey((k) => k + 1); }}
                      disabled={stars >= MAX_SKILL_STARS}
                      className="w-14 h-14 rounded-2xl border-[3px] border-ink bg-primary text-primary-foreground shadow-pop-sm hover:-translate-y-0.5 hover:shadow-pop active:translate-y-[3px] active:shadow-none transition-all grid place-items-center disabled:opacity-40"
                      aria-label="Augmenter"
                    >
                      <Plus size={26} strokeWidth={3.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div key={pulseKey} className="sr-only">tap</div>
        </section>
      )}

      {/* ============== DEBRIEF ============== */}
      {phase === "debrief" && outcome && (
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-5">
          <div className="pop-card p-5 bg-gradient-to-br from-secondary/20 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-secondary" strokeWidth={3} />
              <h2 className="font-display text-2xl">Progressions ({outcome.progressed.length})</h2>
            </div>
            {outcome.progressed.length === 0 ? (
              <p className="text-sm font-semibold text-ink-soft">Aucune progression enregistrée pendant cette situation.</p>
            ) : (
              <ul className="space-y-1.5">
                {outcome.progressed.map((p, i) => (
                  <li key={i} className="text-sm font-semibold flex items-center gap-2">
                    <span className="font-display px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">{p.skillCode}</span>
                    <span>{p.studentName}</span>
                    <span className="text-ink-soft">N{p.before} → N{p.after}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
      )}
    </main>
  );
}
