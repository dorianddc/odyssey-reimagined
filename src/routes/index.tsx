// Sport Pop Hub — pick a class to enter the game.
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trophy, Users, Sparkles, ChevronRight, Plus, Trash2, Map as MapIcon, X, BarChart3 } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PopButton } from "@/components/game/PopButton";
import { ClassRecapModal } from "@/components/game/ClassRecapModal";
import type { Cycle } from "@/data/curriculum";

export const Route = createFileRoute("/")({
  component: Hub,
});

const cycleStyles: Record<string, { label: string; gradient: string; pill: string }> = {
  cycle3: {
    label: "Cycle 3 · 6ᵉ",
    gradient: "from-secondary to-secondary-glow",
    pill: "bg-secondary text-secondary-foreground",
  },
  cycle4: {
    label: "Cycle 4 · 5ᵉ→3ᵉ",
    gradient: "from-primary to-accent",
    pill: "bg-accent text-accent-foreground",
  },
};

const EMOJI_CHOICES = ["🐣", "🦊", "⚡", "🔥", "🚀", "🏆", "👑", "💎", "🦁", "🐻", "🐯", "🦅", "🦄", "🐲", "🌟", "🏸"];

function Hub() {
  const navigate = useNavigate();
  const { classes, studentsByClass, ensureClass, addClass, removeClass } = useAppStore();

  const [openAdd, setOpenAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [recapId, setRecapId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cycle, setCycle] = useState<Cycle>("cycle4");
  const [emoji, setEmoji] = useState<string>("🏸");

  const handleEnter = (classId: string) => {
    ensureClass(classId);
    navigate({ to: "/class/$classId", params: { classId } });
  };

  const handleParcours = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ensureClass(classId);
    navigate({ to: "/class/$classId/parcours", params: { classId } });
  };

  const handleConfirmAdd = () => {
    if (!name.trim()) return;
    addClass({ name: name.trim(), cycle, emoji });
    setName("");
    setCycle("cycle4");
    setEmoji("🏸");
    setOpenAdd(false);
  };

  const classToDelete = classes.find((c) => c.id === confirmDel);

  return (
    <main className="min-h-screen px-6 py-10 md:py-16">
      <header className="max-w-6xl mx-auto mb-14 md:mb-20 relative flex flex-col items-center text-center">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 -z-10 w-[400px] h-[400px] rounded-full bg-primary/30 blur-3xl" />

        <div className="relative inline-block animate-pop-in">
          <h1 className="font-display text-7xl md:text-9xl tracking-tight leading-none">
            <span className="text-foreground">DÉFI</span>{" "}
            <span className="text-gradient-sun drop-shadow-[0_4px_0_hsl(var(--ink))]">BADMINTON</span>
          </h1>
          <span className="absolute -top-6 -right-10 text-6xl animate-float-y" aria-hidden>🏸</span>
        </div>

        <div className="inline-flex items-center gap-2 bg-surface border-[3px] border-ink rounded-full px-4 py-2 shadow-pop-sm mt-6 animate-fade-in">
          <Sparkles size={16} className="text-primary" strokeWidth={3} />
          <span className="text-xs font-bold uppercase tracking-widest">Éducation Physique & Sportive · Saison 2026</span>
        </div>

        <p className="mt-6 text-base md:text-lg text-ink-soft max-w-xl mx-auto font-semibold">
          Le suivi ludique des compétences en badminton scolaire. Sélectionnez une classe pour évaluer la progression de vos élèves.
        </p>
      </header>

      <section className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Trophy className="text-primary" strokeWidth={3} />
          <h2 className="font-display text-3xl tracking-wide">Sélectionnez une classe</h2>
          <div className="flex-1 h-1 bg-ink/10 rounded-full" />
          <PopButton variant="primary" size="sm" onClick={() => setOpenAdd(true)}>
            <Plus size={16} strokeWidth={3} /> Ajouter une classe
          </PopButton>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {classes.map((cls, i) => {
            const style = cycleStyles[cls.cycle];
            const count = studentsByClass[cls.id]?.length ?? 0;
            return (
              <div
                key={cls.id}
                className="pop-card-interactive p-5 text-left relative overflow-hidden group animate-pop-in"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => handleEnter(cls.id)}
              >
                <div className={cn("absolute inset-x-0 top-0 h-2 bg-gradient-to-r", style.gradient)} />

                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDel(cls.id); }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 grid place-items-center rounded-full bg-surface border-[2.5px] border-ink shadow-pop-sm hover:bg-hot hover:text-hot-foreground transition-colors"
                  aria-label={`Supprimer ${cls.name}`}
                  title="Supprimer la classe"
                >
                  <Trash2 size={14} strokeWidth={3} />
                </button>

                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className={cn("w-16 h-16 grid place-items-center rounded-2xl border-[3px] border-ink shadow-pop-sm font-display text-2xl bg-gradient-to-br", style.gradient)}>
                    <span className="text-ink drop-shadow-[0_2px_0_hsl(var(--surface)/0.5)]">{cls.id.slice(0, 3)}</span>
                  </div>
                  <span className="text-3xl group-hover:animate-bounce-soft mr-9" aria-hidden>{cls.emoji}</span>
                </div>

                <h3 className="font-display text-2xl tracking-wide leading-tight">{cls.name}</h3>
                <span className={cn("inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md mt-2 border-2 border-ink", style.pill)}>
                  {style.label}
                </span>

                <div className="mt-5 pt-4 border-t-2 border-dashed border-ink/15 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase">
                    <Users size={14} strokeWidth={3} />
                    {count} élève{count > 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); ensureClass(cls.id); setRecapId(cls.id); }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface text-ink border-2 border-ink text-[10px] font-display uppercase tracking-wider shadow-pop-sm hover:-translate-y-0.5 hover:bg-gradient-sun transition-all"
                      title="Récap. de classe"
                    >
                      <BarChart3 size={12} strokeWidth={3} /> Récap
                    </button>
                    <button
                      onClick={(e) => handleParcours(cls.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent text-accent-foreground border-2 border-ink text-[10px] font-display uppercase tracking-wider shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                      title="Voir le parcours"
                    >
                      <MapIcon size={12} strokeWidth={3} /> Parcours
                    </button>
                    <ChevronRight className="text-primary group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setOpenAdd(true)}
            className="rounded-[var(--radius)] border-[3px] border-dashed border-ink/40 bg-surface/50 hover:bg-surface hover:border-ink min-h-[230px] grid place-items-center group transition-all hover:shadow-pop-sm"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl border-[3px] border-ink bg-primary text-primary-foreground grid place-items-center shadow-pop-sm group-hover:rotate-90 transition-transform">
                <Plus size={28} strokeWidth={3} />
              </div>
              <p className="mt-3 font-display text-lg tracking-wide">Nouvelle classe</p>
              <p className="text-[10px] uppercase tracking-widest text-ink-soft font-bold">Ajouter à la saison</p>
            </div>
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto mt-20 text-center text-xs text-ink-soft/70 font-semibold uppercase tracking-widest">
        🏸 Conçu pour l'EPS · v0.1
      </footer>

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl tracking-wide flex items-center gap-2">
              <Plus className="text-primary" strokeWidth={3} /> Nouvelle classe
            </DialogTitle>
            <DialogDescription className="font-semibold text-ink-soft">
              Renseignez le nom de la classe et son cycle EPS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block mb-1.5">Nom de la classe</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. 6ème C, 4ème Verte..."
                className="w-full bg-surface-2 border-[3px] border-ink rounded-2xl py-3 px-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/40"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block mb-1.5">Cycle</label>
              <div className="grid grid-cols-2 gap-2">
                {(["cycle3", "cycle4"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={cn(
                      "px-3 py-3 rounded-2xl border-[3px] border-ink font-display tracking-wider uppercase text-sm transition-all",
                      cycle === c
                        ? c === "cycle3"
                          ? "bg-secondary text-secondary-foreground shadow-pop-sm"
                          : "bg-accent text-accent-foreground shadow-pop-sm"
                        : "bg-surface-2 hover:bg-muted",
                    )}
                  >
                    {c === "cycle3" ? "Cycle 3 · 6ᵉ" : "Cycle 4 · 5ᵉ→3ᵉ"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block mb-1.5">Mascotte</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "w-10 h-10 grid place-items-center rounded-xl border-[2.5px] border-ink text-xl transition-all",
                      emoji === e ? "bg-primary shadow-pop-sm scale-110" : "bg-surface-2 hover:bg-muted",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <PopButton variant="ghost" size="sm" onClick={() => setOpenAdd(false)}>
              <X size={14} strokeWidth={3} /> Annuler
            </PopButton>
            <PopButton variant="primary" size="sm" onClick={handleConfirmAdd} disabled={!name.trim()}>
              <Plus size={14} strokeWidth={3} /> Créer la classe
            </PopButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-wide">
              Supprimer la classe {classToDelete?.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold text-ink-soft">
              Cette action est définitive. Tous les élèves et évaluations associés seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[3px] border-ink rounded-2xl font-display uppercase">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDel) removeClass(confirmDel); setConfirmDel(null); }}
              className="bg-hot text-hot-foreground border-[3px] border-ink rounded-2xl font-display uppercase shadow-pop-sm"
            >
              <Trash2 size={14} strokeWidth={3} className="mr-1.5" /> Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {recapId && (() => {
        const cls = classes.find((c) => c.id === recapId);
        if (!cls) return null;
        return (
          <ClassRecapModal
            open={!!recapId}
            onOpenChange={(o) => !o && setRecapId(null)}
            className={cls.name}
            cycle={cls.cycle}
            students={studentsByClass[cls.id] || []}
          />
        );
      })()}
    </main>
  );
}
