// Class statistical recap — portrait-style "PDF" dialog summarizing tier
// distribution and number of students with difficulties per dimension.
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RANK_TIERS, type DimensionKey, type Student } from "@/data/curriculum";
import { Activity, Brain, Users, BarChart3, AlertTriangle, Move, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  className: string;
  cycle: "cycle3" | "cycle4";
  students: Student[];
}

const DIM_INFO: Record<DimensionKey, { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; cls: string }> = {
  moteur:      { label: "Motrice",     icon: Activity,  cls: "bg-[oklch(0.65_0.22_25)] text-white" },
  technique:   { label: "Technique",   icon: Activity,  cls: "bg-[oklch(0.65_0.22_25)] text-white" },
  deplacement: { label: "Déplacement", icon: Move,      cls: "bg-[oklch(0.65_0.22_25)] text-white" },
  tactique:    { label: "Tactique",    icon: Crosshair, cls: "bg-[oklch(0.72_0.20_45)] text-white" },
  methodo:     { label: "Méthodo",     icon: Brain,     cls: "bg-[oklch(0.82_0.18_115)] text-ink" },
  social:      { label: "Sociale",     icon: Users,     cls: "bg-[oklch(0.65_0.18_240)] text-white" },
};

export function ClassRecapModal({ open, onOpenChange, className, cycle, students }: Props) {
  const stats = useMemo(() => {
    const tiers = RANK_TIERS.map((t) => ({
      ...t,
      count: students.filter((s) => s.level >= t.range[0] && s.level <= t.range[1]).length,
    }));
    const withDifficulty = students.filter((s) => (s.difficulties || []).length > 0).length;
    const dims: Record<DimensionKey, number> = { moteur: 0, methodo: 0, social: 0, technique: 0, deplacement: 0, tactique: 0 };
    students.forEach((s) => {
      const set = new Set<DimensionKey>();
      (s.difficulties || []).forEach((d) => set.add(d.dimension));
      set.forEach((d) => (dims[d] += 1));
    });
    const avgLevel = students.length
      ? (students.reduce((acc, s) => acc + s.level, 0) / students.length)
      : 0;
    return { tiers, withDifficulty, dims, total: students.length, avgLevel };
  }, [students]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)] max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-sun border-b-[3px] border-ink p-5">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wide flex items-center gap-2 text-ink">
              <BarChart3 strokeWidth={3} /> Récap. de Classe
            </DialogTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/70">
              {className} · {cycle === "cycle3" ? "Cycle 3" : "Cycle 4"} · {stats.total} élèves
            </p>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Average */}
          <div className="rounded-2xl border-[2.5px] border-ink bg-surface-2 p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-sun border-[3px] border-ink shadow-pop-sm grid place-items-center">
              <span className="font-display text-2xl text-ink leading-none">N{stats.avgLevel.toFixed(1)}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Niveau moyen</p>
              <p className="font-display text-base">de la classe</p>
            </div>
          </div>

          {/* Tier distribution */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-widest mb-2">Répartition par rang</h3>
            <div className="space-y-1.5">
              {stats.tiers.map((t) => {
                const pct = stats.total ? Math.round((t.count / stats.total) * 100) : 0;
                return (
                  <div key={t.tier} className="rounded-xl border-[2.5px] border-ink overflow-hidden">
                    <div className={cn("flex items-center gap-2 px-3 py-1.5", t.headerCls)}>
                      <span aria-hidden>{t.emoji}</span>
                      <span className="font-display text-sm tracking-wider uppercase flex-1">{t.label}</span>
                      <span className="text-[10px] font-bold opacity-80">N{t.range[0]}–{t.range[1]}</span>
                      <span className="font-display text-base">{t.count}</span>
                    </div>
                    <div className="h-2 bg-surface-2">
                      <div className={cn("h-full transition-all", t.headerCls)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulties */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} strokeWidth={3} className="text-hot" /> Élèves en difficulté
            </h3>
            <div className="rounded-2xl border-[2.5px] border-ink bg-hot/10 p-3 mb-2">
              <p className="font-display text-3xl text-hot leading-none">{stats.withDifficulty}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                ayant ≥ 1 pastille
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DIM_INFO) as DimensionKey[]).map((d) => {
                const info = DIM_INFO[d];
                const Icon = info.icon;
                return (
                  <div key={d} className="rounded-xl border-[2.5px] border-ink overflow-hidden">
                    <div className={cn("px-2 py-1 flex items-center gap-1", info.cls)}>
                      <Icon size={12} strokeWidth={3} />
                      <span className="font-display text-[10px] uppercase tracking-wider">{info.label}</span>
                    </div>
                    <div className="bg-surface-2 px-2 py-2 text-center">
                      <p className="font-display text-2xl leading-none">{stats.dims[d]}</p>
                      <p className="text-[9px] font-bold uppercase text-ink-soft">élèves</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
