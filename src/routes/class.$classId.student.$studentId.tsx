import { createFileRoute, useNavigate as useTanstackNavigate } from "@tanstack/react-router";
// Student profile — the "wow" page: hero, radar, level bar, stars per skill.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Activity, Brain, Users, Move, Crosshair, Sparkles, Trophy, Check, Undo2, Trash2, Map, AlertTriangle } from "lucide-react";
import { CURRICULUM, MAX_LEVEL, getRankBadge, getMaxStarsForCycle, getCycleVocab, getProgressPercentage, type DimensionKey } from "@/data/curriculum";
import { useAppStore } from "@/store/AppStore";
import { useAudio } from "@/lib/audio";
import { AvatarBlob } from "@/components/game/AvatarBlob";
import { PopButton } from "@/components/game/PopButton";
import { FullSpectrumRadar } from "@/components/game/FullSpectrumRadar";
import { StarMeter } from "@/components/game/StarMeter";
import { LevelUpOverlay } from "@/components/game/LevelUpOverlay";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const FOCUS_KEY = "odyssey_focus_student";

const dimIcons: Record<DimensionKey, typeof Activity> = {
  moteur: Activity,
  technique: Activity,
  deplacement: Move,
  tactique: Crosshair,
  methodo: Brain,
  social: Users,
};

const dimColorClass: Record<DimensionKey, string> = {
  moteur:      "bg-dim-motor text-white",
  technique:   "bg-dim-motor text-white",
  deplacement: "bg-dim-motor text-white",
  tactique:    "bg-dim-tactic text-white",
  methodo:     "bg-dim-method text-white",
  social:      "bg-dim-social text-white",
};

// Couleur de la bordure pour la mini-bordure latérale de la carte de contenu.
const dimBorderClass: Record<DimensionKey, string> = {
  moteur:      "border-l-dim-motor",
  technique:   "border-l-dim-motor",
  deplacement: "border-l-dim-motor",
  tactique:    "border-l-dim-tactic",
  methodo:     "border-l-dim-method",
  social:      "border-l-dim-social",
};

const StudentProfile = () => {
  const { classId, studentId } = Route.useParams();
  const navigate = useTanstackNavigate();
  const goBack = () => navigate({ to: "/class/$classId", params: { classId } });
  const goHome = () => navigate({ to: "/" });
  const goOdyssey = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(FOCUS_KEY, studentId);
    }
    navigate({ to: "/class/$classId/parcours", params: { classId } });
  };
  const { classes, ensureClass, getStudent, bumpSkill, removeStudent, pendingLevelUp, clearLevelUp } = useAppStore();
  const { setBgm, playSfx } = useAudio();
  const cls = classes.find((c) => c.id === classId);
  const [burstKeys, setBurstKeys] = useState<Record<string, number>>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [animatedXp, setAnimatedXp] = useState<number | null>(null);
  const lastXpRef = useRef<number | null>(null);

  useEffect(() => {
    if (classId) ensureClass(classId);
  }, [classId, ensureClass]);

  useEffect(() => {
    setBgm("profile");
  }, [setBgm]);

  const student = getStudent(classId, studentId);
  const cycle = cls?.cycle;
  const rank = useMemo(() => (student ? getRankBadge(student.level) : null), [student]);

  if (!cls || !student || !cycle) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="pop-card p-8 text-center">
          <p className="font-display text-3xl">Élève introuvable</p>
          <PopButton variant="primary" onClick={() => goHome()} className="mt-4">
            Retour à l'accueil
          </PopButton>
        </div>
      </main>
    );
  }

  const categories = CURRICULUM[cycle].categories;
  const maxStars = getMaxStarsForCycle(cycle);
  const vocab = getCycleVocab(cycle);
  const totalSkills = Object.values(categories).reduce((acc, c) => acc + c.skills.length, 0);
  const totalStars = Object.values(student.skillStates).reduce((acc, n) => acc + n, 0);
  const maxTotalStars = totalSkills * maxStars;
  // Jauge intra-niveau (0..100) — délégué au helper centralisé.
  // Cycle 3 : (rawLevel % 1)*100, soit +62.5% par étoile (formule TotalÉtoiles × 5/8).
  // Cycle 4 : progression entre level-0.5 et level+0.5.
  const xpPct = Math.round(getProgressPercentage(student.skillStates, cycle));
  const levelPct = xpPct;

  // Animate XP bar progressively when xpPct changes (with sound).
  // First mount = jump straight to current value (no animation).
  // Subsequent changes = slow animated fill (~3.5s) + xp SFX on gain.
  useEffect(() => {
    const from = lastXpRef.current;
    const to = xpPct;
    if (from === null) {
      // initial mount
      lastXpRef.current = to;
      setAnimatedXp(to);
      return;
    }
    if (from === to) return;
    const isGain = to > from;
    if (isGain) playSfx("xp");
    const duration = 3500;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedXp(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else lastXpRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xpPct, playSfx]);

  const handleBump = (skillId: string, dir: "up" | "down") => {
    bumpSkill(classId, studentId, skillId, dir);
    if (dir === "up") {
      setBurstKeys((b) => ({ ...b, [skillId]: (b[skillId] || 0) + 1 }));
    }
  };

  // Map of difficulties by skillId for quick lookup
  const difficultyBySkill = useMemo(() => {
    const map: Record<string, typeof student.difficulties[number]> = {};
    (student.difficulties || []).forEach((d) => { map[d.skillId] = d; });
    return map;
  }, [student.difficulties]);

  return (
    <main className="min-h-screen pb-24">
      {pendingLevelUp && pendingLevelUp.studentId === studentId && (
        <LevelUpOverlay
          studentName={pendingLevelUp.studentName}
          oldLevel={pendingLevelUp.oldLevel}
          newLevel={pendingLevelUp.newLevel}
          onComplete={clearLevelUp}
        />
      )}

      {/* TOP BAR */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b-[3px] border-ink">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <PopButton variant="ghost" size="sm" onClick={() => goBack()}>
            <ArrowLeft size={16} strokeWidth={3} /> {cls.name}
          </PopButton>
          <PopButton variant="primary" size="sm" onClick={goOdyssey} title="Retour à l'Odyssée">
            <Map size={16} strokeWidth={3} /> Retour à l'Odyssée
          </PopButton>
          <div className="flex-1" />
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-soft">
            <Sparkles size={14} className="text-primary" strokeWidth={3} />
            Profil de l'élève
          </span>
          <button
            onClick={() => setConfirmDel(true)}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2.5px] border-ink bg-surface hover:bg-hot hover:text-hot-foreground text-xs font-display uppercase tracking-wider shadow-pop-sm transition-colors"
            title="Supprimer cet élève"
          >
            <Trash2 size={14} strokeWidth={3} /> Supprimer
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <div className="pop-card p-6 md:p-10 court-pattern relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />

          <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-10 items-center relative">
            {/* avatar */}
            <div className="flex justify-center md:justify-start">
              <div className="relative animate-float-y">
                <AvatarBlob name={student.name} hue={student.avatarHue} size={140} rank={rank!.tier} />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-ink text-surface font-display text-xs px-3 py-1 rounded-full border-[3px] border-surface tracking-widest whitespace-nowrap">
                  {rank!.emoji} {rank!.label}
                </div>
              </div>
            </div>

            {/* identity & xp */}
            <div className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                {cls.name} · {cycle === "cycle3" ? "Cycle 3" : "Cycle 4"}
              </p>
              <h1 className="font-display text-5xl md:text-7xl leading-none mt-1">{student.name}</h1>

              {/* level row */}
              <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-sun border-[3px] border-ink shadow-pop-sm grid place-items-center">
                    <span className="font-display text-3xl text-ink leading-none">N{student.level}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Niveau actuel</div>
                    <div className="font-display text-xl">{student.level} / {MAX_LEVEL}</div>
                  </div>
                </div>

                <div className="flex-1 min-w-[160px]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">
                    <span>XP vers N{Math.min(MAX_LEVEL, student.level + 1)}</span>
                    <span className="tabular-nums">{Math.round(animatedXp ?? xpPct)}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted border-[3px] border-ink overflow-hidden shadow-pop-sm relative">
                    <div
                      className="h-full bg-gradient-sun relative"
                      style={{ width: `${animatedXp ?? xpPct}%`, transition: "none" }}
                    >
                      <div className="absolute inset-0 shimmer" />
                      <div className="absolute inset-y-0 right-0 w-2 bg-white/70 blur-[2px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* xp stars */}
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-soft">
                <span>⭐ {totalStars} / {maxTotalStars} étoiles</span>
                <span className="text-ink/30">·</span>
                <span>XP {xpPct}%</span>
              </div>
            </div>

            {/* radar */}
            <div className="flex justify-center md:justify-end">
              <FullSpectrumRadar skillStates={student.skillStates} cycle={cycle} size={300} />
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      {/* DIFFICULTIES ALERT */}
      {(student.difficulties?.length ?? 0) > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
          <div className="relative pop-card overflow-hidden border-[3px] border-[oklch(0.65_0.28_25)] bg-[oklch(0.97_0.04_25)]">
            <div className="absolute inset-0 pointer-events-none animate-pulse bg-[oklch(0.65_0.28_25)]/5" />
            <div className="p-4 md:p-5 flex items-start gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.28_25)] text-white border-[2.5px] border-ink grid place-items-center shrink-0 shadow-pop-sm">
                <AlertTriangle size={22} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg md:text-xl uppercase tracking-wide text-[oklch(0.45_0.22_25)] leading-tight">
                  Difficultés repérées · {student.difficulties.length}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  {vocab.skillPlural} sur {vocab.skillPlural === "Contenus" ? "lesquels" : "lesquelles"} {student.name} stagne actuellement.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {student.difficulties.map((d) => {
                    const skill = Object.values(categories).flatMap((c) => c.skills).find((s) => s.id === d.skillId);
                    return (
                      <div
                        key={d.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-[2.5px] border-ink bg-surface shadow-pop-sm"
                      >
                        <span className="relative inline-grid place-items-center">
                          <span className="absolute inset-0 rounded-full ring-2 ring-[oklch(0.65_0.28_25)] animate-ping" />
                          <span className="relative w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.28_25)]" />
                        </span>
                        <span className="font-display text-xs uppercase">{d.skillCode}</span>
                        <span className="text-xs font-semibold text-ink truncate max-w-[180px]">
                          {skill?.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                          Bloqué N{d.currentLevel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SKILLS — disposition masonry horizontale, ultra compacte (zero scroll). */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="columns-1 md:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
          {(Object.entries(categories) as [DimensionKey, (typeof categories)[DimensionKey]][]).map(
            ([key, cat]) => {
              const Icon = dimIcons[key];
              return (
                <div key={key} className="mb-4 break-inside-avoid pop-card overflow-hidden">
                  {/* En-tête secteur = badge horizontal compact */}
                  <div className={cn(
                    "px-3 py-2 flex items-center gap-2 border-b-[2.5px] border-ink",
                    dimColorClass[key]
                  )}>
                    <div className="w-7 h-7 rounded-lg bg-surface/30 border-2 border-ink/20 grid place-items-center shrink-0">
                      <Icon size={14} strokeWidth={3} />
                    </div>
                    <h2 className="font-display text-sm tracking-wide leading-none uppercase">
                      {vocab.group} {cat.label}
                    </h2>
                    <span className="ml-auto font-display text-[10px] px-1.5 py-0.5 rounded-full bg-surface/30 border border-ink/20">
                      {cat.skills.length}
                    </span>
                  </div>

                  <div className="p-2 space-y-1.5">
                    {cat.skills.map((skill) => {
                      const stars = student.skillStates[skill.id] || 0;
                      const isMax = stars >= maxStars;
                      const burst = burstKeys[skill.id] || 0;
                      const flagged = !!difficultyBySkill[skill.id];
                      return (
                        <div
                          key={skill.id}
                          className={cn(
                            "rounded-xl border-[2px] px-2 py-1.5 shadow-pop-sm relative transition-all",
                            flagged
                              ? "border-[oklch(0.65_0.28_25)] bg-[oklch(0.98_0.03_25)]"
                              : "border-ink bg-surface-2"
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-display text-[10px] px-1.5 py-0.5 rounded-md bg-ink text-surface uppercase shrink-0">
                              {skill.code}
                            </span>
                            <h3 className="font-display text-[12px] leading-tight flex-1 truncate" title={skill.name}>
                              {skill.name}
                            </h3>
                            {flagged && (
                              <AlertTriangle size={12} strokeWidth={3} className="text-[oklch(0.65_0.28_25)] shrink-0" />
                            )}
                            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-soft tabular-nums shrink-0">
                              {stars}/{maxStars}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 min-w-0">
                              <StarMeter
                                value={stars}
                                max={maxStars}
                                burstKey={burst}
                                onIncrement={() => handleBump(skill.id, "up")}
                                onDecrement={() => handleBump(skill.id, "down")}
                              />
                            </div>
                            <button
                              onClick={() => handleBump(skill.id, "down")}
                              disabled={stars <= 0}
                              className="w-7 h-7 grid place-items-center rounded-lg border-[2px] border-ink bg-surface text-ink-soft hover:bg-muted hover:text-ink active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                              aria-label="Annuler le palier"
                              title="Annuler"
                            >
                              <Undo2 size={12} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleBump(skill.id, "up")}
                              disabled={isMax}
                              className={cn(
                                "h-7 px-2 inline-flex items-center gap-1 rounded-lg font-display text-[10px] uppercase tracking-wider",
                                "border-[2px] border-ink bg-primary text-primary-foreground shadow-pop-sm",
                                "hover:-translate-y-0.5 hover:bg-primary-glow active:translate-y-[1px] active:shadow-none",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shrink-0 transition-all"
                              )}
                              aria-label="Valider le palier"
                              title={isMax ? "Maîtrise totale" : "Valider le palier"}
                            >
                              {isMax ? <Trophy size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
                              {isMax ? "Max" : "Valider"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      <p className="text-center text-xs font-semibold uppercase tracking-widest text-ink-soft/70 mt-12">
        Astuce · Cliquez sur « Valider le palier » pour faire progresser l'élève 🏸
      </p>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-wide">
              Supprimer {student.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold text-ink-soft">
              Cette action est définitive. Toutes les évaluations de cet élève seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[3px] border-ink rounded-2xl font-display uppercase">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { removeStudent(classId, studentId); goBack(); }}
              className="bg-hot text-hot-foreground border-[3px] border-ink rounded-2xl font-display uppercase shadow-pop-sm"
            >
              <Trash2 size={14} strokeWidth={3} className="mr-1.5" /> Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};



export const Route = createFileRoute("/class/$classId/student/$studentId")({ component: StudentProfile });
