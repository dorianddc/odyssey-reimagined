import { createFileRoute, useNavigate as useTanstackNavigate } from "@tanstack/react-router";
// Student profile — the "wow" page: hero, radar, level bar, stars per skill.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Activity, Brain, Users, Sparkles, Target, Trophy, Check, Undo2, Trash2, Map, AlertTriangle } from "lucide-react";
import { CURRICULUM, MAX_LEVEL, getRankBadge, type DimensionKey } from "@/data/curriculum";
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
  methodo: Brain,
  social: Users,
};

const dimColorClass: Record<DimensionKey, string> = {
  moteur: "bg-dim-motor text-white",
  methodo: "bg-dim-method text-white",
  social: "bg-dim-social text-white",
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
  const [animatedXp, setAnimatedXp] = useState(0);
  const lastXpRef = useRef(0);

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
  const totalSkills = Object.values(categories).reduce((acc, c) => acc + c.skills.length, 0);
  const totalStars = Object.values(student.skillStates).reduce((acc, n) => acc + n, 0);
  const maxStars = totalSkills * 5;
  // XP toward next level — derive a continuous "raw level" from the same formula
  // used by calculateLevelFromStars (avg*4 + 4 + 0.5 per mastered skill), then
  // measure how far we are between the current rounded level and the next.
  const rawAvg = totalStars > 0 ? Object.values(student.skillStates).reduce((a, n) => a + Math.min(n, 4), 0) / Math.max(1, totalSkills) : 0;
  const masteredCount = Object.values(student.skillStates).filter((n) => n === 5).length;
  const rawLevel = Math.min(MAX_LEVEL, rawAvg * 4 + 4 + masteredCount * 0.5);
  // Math.round transitions at .5 → progression toward next level spans [level-0.5 ; level+0.5]
  const xpPct = student.level >= MAX_LEVEL
    ? 100
    : Math.max(0, Math.min(100, Math.round((rawLevel - (student.level - 0.5)) * 100)));
  const levelPct = xpPct;

  const handleBump = (skillId: string, dir: "up" | "down") => {
    bumpSkill(classId, studentId, skillId, dir);
    if (dir === "up") {
      setBurstKeys((b) => ({ ...b, [skillId]: (b[skillId] || 0) + 1 }));
    }
  };

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
                    <span>{xpPct}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted border-[3px] border-ink overflow-hidden shadow-pop-sm">
                    <div
                      className="h-full bg-gradient-sun transition-all duration-700 relative"
                      style={{ width: `${levelPct}%` }}
                    >
                      <div className="absolute inset-0 shimmer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* xp stars */}
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-soft">
                <span>⭐ {totalStars} / {maxStars} étoiles</span>
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
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {(Object.entries(categories) as [DimensionKey, (typeof categories)[DimensionKey]][]).map(
          ([key, cat]) => {
            const Icon = dimIcons[key];
            return (
              <div key={key} className="pop-card overflow-hidden flex flex-col">
                <div
                  className={cn(
                    "px-5 py-4 flex items-center gap-3 border-b-[3px] border-ink",
                    dimColorClass[key]
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface/30 border-2 border-ink/20 grid place-items-center">
                    <Icon size={22} strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl tracking-wide leading-none">{cat.label}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                      {cat.skills.length} compétence{cat.skills.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  {cat.skills.map((skill) => {
                    const stars = student.skillStates[skill.id] || 0;
                    const currentLabel = stars > 0 ? skill.levels[Math.min(4, stars - 1)] : null;
                    const nextLabel = stars < 5 ? skill.levels[stars] : null;
                    const isMax = stars >= 5;
                    const burst = burstKeys[skill.id] || 0;
                    return (
                      <div
                        key={skill.id}
                        className="rounded-2xl border-[2.5px] border-ink bg-surface-2 p-3 shadow-pop-sm"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-display text-xs px-2 py-0.5 rounded-md bg-ink text-surface uppercase">
                            {skill.code}
                          </span>
                          <h3 className="font-display text-base leading-tight flex-1">{skill.name}</h3>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <StarMeter
                            value={stars}
                            burstKey={burst}
                            onIncrement={() => handleBump(skill.id, "up")}
                            onDecrement={() => handleBump(skill.id, "down")}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                            Palier {stars} / 5
                          </span>
                        </div>

                        {/* Palier actuel */}
                        <div
                          className={cn(
                            "rounded-xl border-2 border-ink/20 bg-surface px-3 py-2 mb-2",
                            stars === 0 && "opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Check size={12} strokeWidth={3} className="text-dim-social" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                              {stars === 0 ? "Aucun palier validé" : `Actuel · Palier ${stars}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink leading-snug">
                            {currentLabel ?? "Cliquez sur les étoiles ou validez le 1er palier ci-dessous."}
                          </p>
                        </div>

                        {/* Prochain palier ou Expert */}
                        {isMax ? (
                          <div className="rounded-xl border-2 border-ink bg-gradient-sun px-3 py-2 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Trophy size={14} strokeWidth={3} className="text-ink" />
                              <span className="text-xs font-display tracking-wide uppercase text-ink">
                                Niveau Expert atteint
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-primary bg-primary/10 px-3 py-2 mb-3 relative overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Target size={12} strokeWidth={3} className="text-primary" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                Objectif · Palier {stars + 1} — à observer
                              </span>
                            </div>
                            <p className="text-xs text-ink leading-snug italic font-medium">
                              {nextLabel}
                            </p>
                          </div>
                        )}

                        {/* Boutons d'évaluation */}
                        <div className="flex items-stretch gap-2">
                          <button
                            onClick={() => handleBump(skill.id, "up")}
                            disabled={isMax}
                            className={cn(
                              "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                              "font-display text-sm tracking-wider uppercase",
                              "border-[2.5px] border-ink shadow-pop-sm",
                              "bg-primary text-primary-foreground",
                              "transition-all duration-150",
                              "hover:-translate-y-0.5 hover:shadow-pop hover:bg-primary-glow",
                              "active:translate-y-[3px] active:shadow-none active:scale-[0.98]",
                              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            )}
                            aria-label="Valider le palier supérieur"
                          >
                            <Check size={18} strokeWidth={3} />
                            {isMax ? "Maîtrise totale" : "Valider le palier"}
                          </button>
                          <button
                            onClick={() => handleBump(skill.id, "down")}
                            disabled={stars <= 0}
                            className={cn(
                              "w-12 grid place-items-center rounded-xl",
                              "border-[2.5px] border-ink bg-surface text-ink-soft",
                              "transition-all duration-150",
                              "hover:bg-muted hover:text-ink hover:-translate-y-0.5",
                              "active:translate-y-[2px]",
                              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            )}
                            aria-label="Annuler le dernier palier"
                            title="Annuler"
                          >
                            <Undo2 size={18} strokeWidth={3} />
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
